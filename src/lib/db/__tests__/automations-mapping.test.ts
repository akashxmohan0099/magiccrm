import { describe, it, expect } from "vitest";
import { mapAutomationRuleFromDB } from "../automations";

describe("mapAutomationRuleFromDB", () => {
  it("maps a fully populated rule", () => {
    const r = mapAutomationRuleFromDB({
      id: "rule-1",
      workspace_id: "ws-1",
      type: "appointment_reminder",
      enabled: true,
      channel: "sms",
      message_template: "Hi {client_name}, see you {time}",
      timing_value: 24,
      timing_unit: "hours",
      created_at: "2026-04-01T00:00:00Z",
      updated_at: "2026-04-01T00:00:00Z",
    });

    expect(r).toMatchObject({
      id: "rule-1",
      workspaceId: "ws-1",
      type: "appointment_reminder",
      enabled: true,
      channel: "sms",
      messageTemplate: "Hi {client_name}, see you {time}",
      timingValue: 24,
      timingUnit: "hours",
    });
  });

  it("handles a rule with no timing (e.g. instant confirmation)", () => {
    const r = mapAutomationRuleFromDB({
      id: "rule-2",
      workspace_id: "ws-1",
      type: "booking_confirmation",
      enabled: true,
      channel: "email",
      message_template: "Confirmed",
      timing_value: null,
      timing_unit: null,
      created_at: "x",
      updated_at: "x",
    });
    expect(r.timingValue).toBeUndefined();
    expect(r.timingUnit).toBeUndefined();
  });
});
