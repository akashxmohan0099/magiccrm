import { describe, it, expect } from "vitest";
import { mapClientFromDB } from "../clients";

/**
 * Snake-to-camel mapping for the Clients table.
 *
 * The DB contract is exhaustive on this layer — components never see
 * snake_case. If a column is added in Postgres, it must be wired through
 * the mapper or the field silently becomes `undefined` everywhere.
 */
describe("mapClientFromDB", () => {
  it("maps a fully populated row into a camelCase Client", () => {
    const row = {
      id: "cli-1",
      workspace_id: "ws-1",
      name: "Sophie Chen",
      email: "sophie@example.com",
      phone: "0412345678",
      notes: "VIP",
      birthday: "1990-05-12",
      medical_alerts: "latex allergy",
      source: "instagram",
      address_street: "42 Palm Avenue",
      address_suburb: "Burleigh",
      address_postcode: "4220",
      address_state: "QLD",
      stripe_payment_method_id: "pm_123",
      patch_tests: [{ category: "color", testedAt: "2026-01-01" }],
      deposit_required: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
    };

    const c = mapClientFromDB(row);

    expect(c).toMatchObject({
      id: "cli-1",
      workspaceId: "ws-1",
      name: "Sophie Chen",
      email: "sophie@example.com",
      phone: "0412345678",
      notes: "VIP",
      birthday: "1990-05-12",
      medicalAlerts: "latex allergy",
      source: "instagram",
      addressStreet: "42 Palm Avenue",
      addressSuburb: "Burleigh",
      addressPostcode: "4220",
      addressState: "QLD",
      stripePaymentMethodId: "pm_123",
      depositRequired: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    });
    expect(c.patchTests).toEqual([{ category: "color", testedAt: "2026-01-01" }]);
  });

  it("normalises null / missing optional fields", () => {
    const row = {
      id: "cli-2",
      workspace_id: "ws-1",
      name: "Walk-in",
      email: null,
      phone: null,
      notes: null,
      birthday: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const c = mapClientFromDB(row);

    // Required string fields default to ""
    expect(c.email).toBe("");
    expect(c.phone).toBe("");
    expect(c.notes).toBe("");
    // Optional fields collapse to undefined (not null) for the TS contract
    expect(c.birthday).toBeUndefined();
    expect(c.medicalAlerts).toBeUndefined();
    expect(c.source).toBeUndefined();
    expect(c.depositRequired).toBeUndefined();
    expect(c.patchTests).toBeUndefined();
  });

  it("never leaks snake_case keys", () => {
    const row = {
      id: "cli-3",
      workspace_id: "ws-1",
      name: "Test",
      email: "",
      phone: "",
      notes: "",
      created_at: "now",
      updated_at: "now",
    };

    const c = mapClientFromDB(row) as Record<string, unknown>;

    for (const key of Object.keys(c)) {
      expect(key).not.toMatch(/_/);
    }
  });
});
