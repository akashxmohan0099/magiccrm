import { describe, it, expect } from "vitest";
import {
  validateFileFields,
  fileMatchesAccept,
  SERVER_MAX_FILE_BYTES,
  type FileFieldShape,
} from "../server-file-validation";

const fileField = (overrides: Partial<FileFieldShape>): FileFieldShape => ({
  name: "uploads",
  type: "file",
  label: "Uploads",
  ...overrides,
});

// Tiny base64 builder — produces a dataUrl whose decoded payload is roughly
// `bytes` long. We're approximating via base64 arithmetic, so any exact
// byte target needs base64Len ≈ bytes * 4/3.
function dataUrlOfApproxBytes(bytes: number, mime = "image/png"): string {
  const base64Len = Math.ceil((bytes * 4) / 3);
  return `data:${mime};base64,${"A".repeat(base64Len)}`;
}

const validImageEntry = (sizeBytes = 1024) =>
  JSON.stringify([{ name: "photo.png", type: "image/png", dataUrl: dataUrlOfApproxBytes(sizeBytes) }]);

describe("fileMatchesAccept", () => {
  it("allows any file when accepted is empty", () => {
    expect(fileMatchesAccept(undefined, "anything", "x.bin")).toBe(true);
    expect(fileMatchesAccept("", "anything", "x.bin")).toBe(true);
  });

  it("matches MIME wildcards (image/*)", () => {
    expect(fileMatchesAccept("image/*", "image/png", "p.png")).toBe(true);
    expect(fileMatchesAccept("image/*", "application/pdf", "p.pdf")).toBe(false);
  });

  it("matches exact MIME types", () => {
    expect(fileMatchesAccept("application/pdf", "application/pdf", "f.pdf")).toBe(true);
    expect(fileMatchesAccept("application/pdf", "image/png", "f.png")).toBe(false);
  });

  it("matches by extension (.pdf)", () => {
    expect(fileMatchesAccept(".pdf", "application/octet-stream", "doc.pdf")).toBe(true);
    expect(fileMatchesAccept(".pdf", "application/octet-stream", "doc.txt")).toBe(false);
  });

  it("supports multiple comma-separated tokens", () => {
    expect(fileMatchesAccept("image/*,.pdf", "image/jpeg", "x.jpg")).toBe(true);
    expect(fileMatchesAccept("image/*,.pdf", "application/octet-stream", "x.pdf")).toBe(true);
    expect(fileMatchesAccept("image/*,.pdf", "video/mp4", "x.mp4")).toBe(false);
  });
});

describe("validateFileFields", () => {
  it("returns null when no file fields are present", () => {
    const fields: FileFieldShape[] = [{ name: "name", type: "text" }];
    expect(validateFileFields(fields, { name: "Jane" })).toBeNull();
  });

  it("returns null when a valid single image is uploaded", () => {
    const fields = [fileField({ multipleFiles: false, maxFileSizeMb: 5 })];
    expect(validateFileFields(fields, { uploads: validImageEntry(1024) })).toBeNull();
  });

  it("rejects non-array payloads", () => {
    const fields = [fileField({})];
    const err = validateFileFields(fields, { uploads: JSON.stringify({ not: "an array" }) });
    expect(err).toMatch(/Invalid file payload/);
  });

  it("rejects malformed JSON", () => {
    const fields = [fileField({})];
    const err = validateFileFields(fields, { uploads: "{not json" });
    expect(err).toMatch(/Invalid file payload/);
  });

  it("rejects when entry lacks a dataUrl", () => {
    const fields = [fileField({})];
    const err = validateFileFields(fields, {
      uploads: JSON.stringify([{ name: "x.png", type: "image/png" }]),
    });
    expect(err).toMatch(/Invalid file entry/);
  });

  it("enforces multipleFiles=false (hard 1 file cap)", () => {
    const fields = [fileField({ multipleFiles: false })];
    const err = validateFileFields(fields, {
      uploads: JSON.stringify([
        { name: "a.png", type: "image/png", dataUrl: dataUrlOfApproxBytes(100) },
        { name: "b.png", type: "image/png", dataUrl: dataUrlOfApproxBytes(100) },
      ]),
    });
    expect(err).toMatch(/up to 1 file/);
  });

  it("enforces per-field maxFiles when multiple are allowed", () => {
    const fields = [fileField({ multipleFiles: true, maxFiles: 2 })];
    const err = validateFileFields(fields, {
      uploads: JSON.stringify([
        { name: "a.png", type: "image/png", dataUrl: dataUrlOfApproxBytes(50) },
        { name: "b.png", type: "image/png", dataUrl: dataUrlOfApproxBytes(50) },
        { name: "c.png", type: "image/png", dataUrl: dataUrlOfApproxBytes(50) },
      ]),
    });
    expect(err).toMatch(/up to 2 files/);
  });

  it("enforces per-field maxFileSizeMb (operator's tighter rule wins)", () => {
    const fields = [fileField({ multipleFiles: false, maxFileSizeMb: 1 })];
    const err = validateFileFields(fields, {
      uploads: JSON.stringify([
        { name: "big.png", type: "image/png", dataUrl: dataUrlOfApproxBytes(2 * 1024 * 1024) },
      ]),
    });
    expect(err).toMatch(/exceeds the 1MB limit/);
  });

  it("falls back to the global hard cap when operator's rule is generous", () => {
    const fields = [fileField({ multipleFiles: false, maxFileSizeMb: 100 })];
    const err = validateFileFields(fields, {
      uploads: JSON.stringify([
        {
          name: "huge.png",
          type: "image/png",
          dataUrl: dataUrlOfApproxBytes(SERVER_MAX_FILE_BYTES + 100_000),
        },
      ]),
    });
    expect(err).toMatch(/exceeds the 8MB limit/);
  });

  it("enforces acceptedFileTypes (PDF-only field rejects images)", () => {
    const fields = [fileField({ multipleFiles: false, acceptedFileTypes: "application/pdf,.pdf" })];
    const err = validateFileFields(fields, {
      uploads: JSON.stringify([
        { name: "photo.png", type: "image/png", dataUrl: dataUrlOfApproxBytes(100) },
      ]),
    });
    expect(err).toMatch(/isn't an accepted type/);
  });

  it("accepts files that match acceptedFileTypes", () => {
    const fields = [fileField({ multipleFiles: false, acceptedFileTypes: "application/pdf,.pdf" })];
    expect(
      validateFileFields(fields, {
        uploads: JSON.stringify([
          {
            name: "doc.pdf",
            type: "application/pdf",
            dataUrl: dataUrlOfApproxBytes(100),
          },
        ]),
      }),
    ).toBeNull();
  });

  it("ignores fields where the value is empty", () => {
    const fields = [fileField({ multipleFiles: false })];
    expect(validateFileFields(fields, { uploads: "" })).toBeNull();
  });
});
