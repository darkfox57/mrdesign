import { describe, expect, it } from "vitest";
import { emailStatus, firstName, isValidEmail } from "./demo-form";

describe("isValidEmail", () => {
  it("accepts an address with a user, an @ and a domain", () => {
    expect(isValidEmail("laura@correo.com")).toBe(true);
    expect(isValidEmail("  ana.perez@empresa.com.co ")).toBe(true);
  });

  it("rejects an address missing the @, the domain or its ending", () => {
    for (const value of ["", "laura", "laura@", "@correo.com", "laura@correo", "laura@correo.c", "la ura@correo.com"]) {
      expect(isValidEmail(value), value).toBe(false);
    }
  });
});

describe("emailStatus", () => {
  it("says nothing until the visitor leaves the field or types a valid address", () => {
    expect(emailStatus("", false)).toBe("idle");
    expect(emailStatus("laura@", false)).toBe("idle");
  });

  it("confirms a valid address as soon as it is typed", () => {
    expect(emailStatus("laura@correo.com", false)).toBe("ok");
    expect(emailStatus("laura@correo.com", true)).toBe("ok");
  });

  it("flags an invalid address once the field was left", () => {
    expect(emailStatus("laura@", true)).toBe("error");
    expect(emailStatus("", true)).toBe("error");
  });
});

describe("firstName", () => {
  it("takes the first word of the name", () => {
    expect(firstName("  Laura Restrepo ")).toBe("Laura");
  });

  it("returns null without a name", () => {
    expect(firstName("   ")).toBeNull();
  });
});
