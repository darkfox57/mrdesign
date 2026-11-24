import { describe, expect, it } from "vitest";
import {
  LOCALE_LABELS,
  canReadInbox,
  inboxHref,
  messageIdSchema,
  messagePreview,
  parseInboxFilter,
  projectTypeLabel,
  readChangeSchema,
  replyHref,
} from "./messages";

describe("canReadInbox", () => {
  it("lets only admins read contact messages", () => {
    expect(canReadInbox("admin")).toBe(true);
    expect(canReadInbox("editor")).toBe(false);
  });
});

describe("parseInboxFilter", () => {
  it("defaults to every message, first page", () => {
    expect(parseInboxFilter({})).toEqual({ unreadOnly: false, page: 1, deleted: false });
  });

  it("reads the unread filter, the page and the deleted notice", () => {
    expect(parseInboxFilter({ filtro: "sin-leer", page: "3", eliminado: "1" })).toEqual({
      unreadOnly: true,
      page: 3,
      deleted: true,
    });
  });

  it("ignores unknown filters and invalid pages instead of failing", () => {
    expect(parseInboxFilter({ filtro: "spam", page: "-2", eliminado: "yes" })).toEqual({
      unreadOnly: false,
      page: 1,
      deleted: false,
    });
    expect(parseInboxFilter({ page: "abc" }).page).toBe(1);
  });

  it("takes the first value of a repeated parameter", () => {
    expect(parseInboxFilter({ filtro: ["sin-leer", "x"], page: ["2", "9"] })).toMatchObject({ unreadOnly: true, page: 2 });
  });
});

describe("inboxHref", () => {
  it("keeps the filter and omits the first page", () => {
    expect(inboxHref({ unreadOnly: false, page: 1 })).toBe("/admin/mensajes");
    expect(inboxHref({ unreadOnly: true, page: 1 })).toBe("/admin/mensajes?filtro=sin-leer");
    expect(inboxHref({ unreadOnly: true, page: 2 })).toBe("/admin/mensajes?filtro=sin-leer&page=2");
  });
});

describe("messageIdSchema", () => {
  it("accepts an id and rejects an empty or oversized one", () => {
    expect(messageIdSchema.safeParse({ messageId: "cm123" }).success).toBe(true);
    expect(messageIdSchema.safeParse({ messageId: "" }).success).toBe(false);
    expect(messageIdSchema.safeParse({ messageId: "x".repeat(65) }).success).toBe(false);
    expect(messageIdSchema.safeParse({}).success).toBe(false);
  });
});

describe("readChangeSchema", () => {
  it("turns the requested state into a boolean", () => {
    expect(readChangeSchema.safeParse({ messageId: "cm1", read: "true" }).data).toEqual({ messageId: "cm1", read: true });
    expect(readChangeSchema.safeParse({ messageId: "cm1", read: "false" }).data).toEqual({ messageId: "cm1", read: false });
  });

  it("rejects anything but true or false", () => {
    expect(readChangeSchema.safeParse({ messageId: "cm1", read: "toggle" }).success).toBe(false);
    expect(readChangeSchema.safeParse({ messageId: "", read: "true" }).success).toBe(false);
  });
});

describe("projectTypeLabel", () => {
  it("names a service in Spanish", () => {
    expect(projectTypeLabel("wordpress")).toBe("Sitios y tiendas en WordPress");
    expect(projectTypeLabel("websites")).toBe("Sitios web a la medida");
  });

  it("names the other option", () => {
    expect(projectTypeLabel("other")).toBe("Otra cosa");
  });

  it("shows an unknown stored value as is", () => {
    expect(projectTypeLabel("legacy-type")).toBe("legacy-type");
  });
});

describe("LOCALE_LABELS", () => {
  it("names both site languages", () => {
    expect(LOCALE_LABELS).toEqual({ es: "Español", en: "Inglés" });
  });
});

describe("messagePreview", () => {
  it("keeps short messages and cuts long ones", () => {
    expect(messagePreview("Hola")).toBe("Hola");
    const long = "a".repeat(120);
    expect(messagePreview(long)).toBe(`${"a".repeat(90)}…`);
  });
});

describe("replyHref", () => {
  it("writes to the sender with a subject in their language", () => {
    expect(replyHref("ana@example.com", "es")).toBe(
      "mailto:ana@example.com?subject=Re%3A%20tu%20mensaje%20a%20Mr.%20Design",
    );
    expect(replyHref("ana@example.com", "en")).toBe(
      "mailto:ana@example.com?subject=Re%3A%20your%20message%20to%20Mr.%20Design",
    );
  });

  it("encodes the address so it cannot add mail headers", () => {
    expect(replyHref("a@b.co?bcc=x@y.co", "es")).toMatch(/^mailto:a@b\.co%3Fbcc%3Dx@y\.co\?subject=/);
  });
});
