import { describe, it, expect } from "vitest";
import {
  parseCSV,
  detectSource,
  buildDefaultMappings,
  transformClientRows,
  type ColumnMapping,
} from "../csv-import";

describe("parseCSV", () => {
  it("parses basic CSV", () => {
    const result = parseCSV("Name,Email\nAlice,alice@test.com\nBob,bob@test.com");
    expect(result.headers).toEqual(["Name", "Email"]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual(["Alice", "alice@test.com"]);
  });

  it("handles quoted fields with commas", () => {
    const result = parseCSV('Name,Notes\n"Smith, Jane","Has allergy"');
    expect(result.rows[0]).toEqual(["Smith, Jane", "Has allergy"]);
  });

  it("strips BOM", () => {
    const bom = "\uFEFF";
    const result = parseCSV(`${bom}Name,Email\nTest,test@test.com`);
    expect(result.headers[0]).toBe("Name");
  });

  it("skips empty rows", () => {
    const result = parseCSV("Name\nAlice\n\n\nBob\n");
    expect(result.rows).toHaveLength(2);
  });
});

describe("detectSource", () => {
  it("detects Fresha headers", () => {
    expect(detectSource(["First name", "Last name", "Mobile number", "Client Since"])).toBe("fresha");
  });

  it("detects Timely headers", () => {
    expect(detectSource(["client_name", "client_email", "client_phone"])).toBe("timely");
  });

  it("returns generic for unknown headers", () => {
    expect(detectSource(["name", "email"])).toBe("generic");
  });
});

describe("buildDefaultMappings", () => {
  it("maps common headers to target fields", () => {
    const mappings = buildDefaultMappings(
      ["First name", "Last name", "Email", "Mobile number"],
      "clients"
    );
    expect(mappings.length).toBe(4);
    const emailMapping = mappings.find((m) => m.csvColumn === "Email");
    expect(emailMapping?.targetField).toBe("email");
  });

  it("sets skip for unrecognized columns", () => {
    const mappings = buildDefaultMappings(["Random XYZ"], "clients");
    expect(mappings[0].targetField).toBe("skip");
  });
});

describe("transformClientRows", () => {
  it("transforms mapped rows into client objects", () => {
    const headers = ["First name", "Last name", "Email", "Mobile number"];
    const rows = [
      ["Jane", "Smith", "jane@test.com", "0412345678"],
      ["Bob", "", "bob@test.com", ""],
    ];
    const mappings: ColumnMapping[] = [
      { csvColumn: "First name", targetField: "firstName" },
      { csvColumn: "Last name", targetField: "lastName" },
      { csvColumn: "Email", targetField: "email" },
      { csvColumn: "Mobile number", targetField: "phone" },
    ];
    const result = transformClientRows(rows, headers, mappings);

    expect(result.valid.length).toBe(2);
    expect(result.valid[0].name).toBe("Jane Smith");
    expect(result.valid[0].email).toBe("jane@test.com");
    expect(result.valid[0].phone).toBe("+61412345678");
    expect(result.valid[1].name).toBe("Bob");
  });

  it("skips rows with no name", () => {
    const mappings: ColumnMapping[] = [{ csvColumn: "Email", targetField: "email" }];
    const result = transformClientRows(
      [["test@test.com"]],
      ["Email"],
      mappings
    );
    expect(result.valid).toHaveLength(0);
    expect(result.skipped).toBe(1);
  });
});
