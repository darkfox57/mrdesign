import { describe, expect, it } from "vitest";
import { contactNeeds } from "@/content/home";
import { projectTypes } from "@/lib/contact/contact-form";
import { projectTypeForNeeds } from "./project-type";

describe("projectTypeForNeeds", () => {
  it("sends other when nothing is picked", () => {
    expect(projectTypeForNeeds([])).toBe("other");
  });

  it("sends the service of a single pick", () => {
    expect(projectTypeForNeeds(["website"])).toBe("websites");
    expect(projectTypeForNeeds(["app"])).toBe("apps");
    expect(projectTypeForNeeds(["integration"])).toBe("plugins");
  });

  it("sends the service when every pick points to it", () => {
    expect(projectTypeForNeeds(["website", "funnel"])).toBe("websites");
  });

  it("ignores picks without a service of their own", () => {
    expect(projectTypeForNeeds(["app", "unsure", "improve"])).toBe("apps");
    expect(projectTypeForNeeds(["unsure"])).toBe("other");
    expect(projectTypeForNeeds(["store"])).toBe("other");
  });

  it("sends other when the picks point to different services", () => {
    expect(projectTypeForNeeds(["website", "app"])).toBe("other");
  });

  it("ignores unknown ids", () => {
    expect(projectTypeForNeeds(["not-a-need", "app"])).toBe("apps");
  });

  it("maps every need to a project type the contact action accepts", () => {
    for (const need of contactNeeds) expect(projectTypes).toContain(need.projectType);
    expect(new Set(contactNeeds.map((need) => need.id)).size).toBe(contactNeeds.length);
  });
});
