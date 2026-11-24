import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MediaLibraryError from "../imagenes/error";
import InboxError from "./error";

// Next passes `error`, `reset` and `retry` (next/error ErrorInfo); "Reintentar" must call `retry`,
// which fetches the segment again, and the error must reach the console for later correlation.
describe.each([
  ["inbox", InboxError, "No se pudieron cargar los mensajes"],
  ["media library", MediaLibraryError, "No se pudo cargar la biblioteca de imágenes."],
])("the %s error boundary", (_, Boundary, message) => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("logs the error and retries the segment", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = Object.assign(new Error("database unreachable"), { digest: "123" });
    const retry = vi.fn();
    const reset = vi.fn();
    render(<Boundary error={error} retry={retry} reset={reset} />);

    expect(screen.getByRole("alert").textContent).toContain(message);
    expect(logged).toHaveBeenCalledWith(error);

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(reset).not.toHaveBeenCalled();
  });
});
