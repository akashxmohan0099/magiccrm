import { describe, it, expect } from "vitest";
import { mapConversationFromDB, mapMessageFromDB } from "../communication";

describe("mapConversationFromDB", () => {
  it("maps a fully populated conversation row", () => {
    const row = {
      id: "conv-1",
      workspace_id: "ws-1",
      contact_name: "Jane",
      contact_email: "jane@example.com",
      contact_phone: "0412345678",
      contact_social_handle: "@jane",
      channel: "instagram",
      client_id: "cli-1",
      external_conversation_id: "ig_thread_123",
      last_message_at: "2026-05-01T10:00:00Z",
      unread_count: 3,
      created_at: "2026-04-01T00:00:00Z",
      updated_at: "2026-05-01T10:00:00Z",
    };

    const c = mapConversationFromDB(row);

    expect(c).toMatchObject({
      id: "conv-1",
      workspaceId: "ws-1",
      contactName: "Jane",
      contactEmail: "jane@example.com",
      contactPhone: "0412345678",
      contactSocialHandle: "@jane",
      channel: "instagram",
      clientId: "cli-1",
      externalConversationId: "ig_thread_123",
      lastMessageAt: "2026-05-01T10:00:00Z",
      unreadCount: 3,
    });
  });

  it("defaults unreadCount to 0 when null", () => {
    const c = mapConversationFromDB({
      id: "conv-2",
      workspace_id: "ws-1",
      channel: "email",
      unread_count: null,
      created_at: "x",
      updated_at: "x",
    });
    expect(c.unreadCount).toBe(0);
  });

  it("collapses null contact fields to undefined", () => {
    const c = mapConversationFromDB({
      id: "conv-3",
      workspace_id: "ws-1",
      channel: "sms",
      contact_name: null,
      contact_email: null,
      contact_phone: null,
      contact_social_handle: null,
      created_at: "x",
      updated_at: "x",
    });
    expect(c.contactName).toBeUndefined();
    expect(c.contactEmail).toBeUndefined();
    expect(c.contactPhone).toBeUndefined();
    expect(c.contactSocialHandle).toBeUndefined();
  });
});

describe("mapMessageFromDB", () => {
  it("maps a message row", () => {
    const m = mapMessageFromDB({
      id: "msg-1",
      conversation_id: "conv-1",
      workspace_id: "ws-1",
      content: "Hi there!",
      sender: "user",
      external_message_id: "ig_msg_999",
      created_at: "2026-05-01T10:00:00Z",
    });

    expect(m).toMatchObject({
      id: "msg-1",
      conversationId: "conv-1",
      workspaceId: "ws-1",
      content: "Hi there!",
      sender: "user",
      externalMessageId: "ig_msg_999",
      createdAt: "2026-05-01T10:00:00Z",
    });
  });

  it("returns undefined externalMessageId when missing", () => {
    const m = mapMessageFromDB({
      id: "msg-2",
      conversation_id: "conv-1",
      workspace_id: "ws-1",
      content: "Reply",
      sender: "client",
      created_at: "x",
    });
    expect(m.externalMessageId).toBeUndefined();
  });
});
