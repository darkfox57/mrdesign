import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RequestResetForm } from "./RequestResetForm";

vi.mock("../password-actions", () => ({
  requestPasswordReset: vi.fn(async () => ({ unavailable: true, email: "ana@mrdesign.agency" })),
}));

describe("RequestResetForm", () => {
  it("asks to try again later when the request could not be processed, keeping the email", async () => {
    render(<RequestResetForm />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ana@mrdesign.agency" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar enlace" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "No pudimos procesar tu pedido en este momento. Prueba de nuevo en unos minutos.",
    );
    expect(screen.queryByRole("status")).toBeNull();
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("ana@mrdesign.agency");
  });
});
