import { describe, expect, it } from "vitest";
import { contactIntents } from "@/content/home";
import { projectTypes } from "@/lib/contact/contact-form";
import { projectTypeForIntent } from "./project-type";

describe("projectTypeForIntent", () => {
  it("puts the founders' intent first", () => {
    expect(contactIntents[0].id).toBe("starting");
    expect(contactIntents[0].label.es).toBe("Estoy empezando mi negocio");
  });

  it("preselects the service an intent names", () => {
    expect(projectTypeForIntent("website")).toBe("websites");
    expect(projectTypeForIntent("app")).toBe("apps");
    expect(projectTypeForIntent("plugin")).toBe("plugins");
  });

  it("sends other when the intent has no service of its own", () => {
    // A store could be Shopify, PrestaShop or custom: the conversation decides.
    expect(projectTypeForIntent("store")).toBe("other");
    expect(projectTypeForIntent("starting")).toBe("other");
  });

  it("sends other for an unknown intent", () => {
    expect(projectTypeForIntent("not-an-intent")).toBe("other");
  });

  it("maps every intent to a project type the contact action accepts, with unique ids", () => {
    for (const intent of contactIntents) expect(projectTypes).toContain(intent.projectType);
    expect(new Set(contactIntents.map((intent) => intent.id)).size).toBe(contactIntents.length);
  });
});
