import { describe, expect, it } from "vitest";
import { canChangeAccount, newUserSchema, roleChangeSchema } from "./users";

describe("newUserSchema", () => {
  const valid = { name: "Ana Pérez", email: "Ana@Mrdesign.com.co", password: "a-long-password", role: "editor" };

  it("accepts a valid user and lowercases the email", () => {
    const parsed = newUserSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.email).toBe("ana@mrdesign.com.co");
  });

  it("rejects a password shorter than 12 characters", () => {
    const parsed = newUserSchema.safeParse({ ...valid, password: "short" });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.password).toEqual(["La contraseña necesita al menos 12 caracteres."]);
  });

  it("rejects an invalid email, an empty name and an unknown role", () => {
    const parsed = newUserSchema.safeParse({ name: " ", email: "nope", password: valid.password, role: "owner" });
    const errors = parsed.error?.flatten().fieldErrors;
    expect(errors?.email).toEqual(["Escribe un email válido."]);
    expect(errors?.name).toEqual(["Escribe el nombre."]);
    expect(errors?.role).toEqual(["Elige un rol válido."]);
  });
});

describe("roleChangeSchema", () => {
  it("accepts only configured roles", () => {
    expect(roleChangeSchema.safeParse({ userId: "u1", role: "admin" }).success).toBe(true);
    expect(roleChangeSchema.safeParse({ userId: "u1", role: "user" }).success).toBe(false);
    expect(roleChangeSchema.safeParse({ userId: "", role: "admin" }).success).toBe(false);
  });
});

describe("canChangeAccount", () => {
  it("blocks changes to your own account so an admin cannot lock themselves out", () => {
    expect(canChangeAccount("me", "me")).toBe(false);
  });

  it("allows changes to other accounts", () => {
    expect(canChangeAccount("me", "other")).toBe(true);
  });
});
