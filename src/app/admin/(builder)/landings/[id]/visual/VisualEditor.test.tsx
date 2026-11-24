import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Puck is replaced by a stand-in that exposes what the editor wires into it: its save button
// (onPublish) and the header actions override, which reads the edited data through usePuck.
const editedData = { root: { props: { title: "Landing", slug: "landing" } }, content: [] };
vi.mock("@puckeditor/core", () => ({
  createUsePuck: () => (select: (state: unknown) => unknown) => select({ appState: { data: editedData } }),
  Puck: ({ onPublish, overrides }: { onPublish: (data: unknown) => void; overrides: { headerActions: (props: { children: ReactNode }) => ReactNode } }) => (
    <div>
      {overrides.headerActions({
        children: (
          <button type="button" onClick={() => onPublish(editedData)}>
            Guardar borrador
          </button>
        ),
      })}
    </div>
  ),
}));
vi.mock("@puckeditor/core/puck.css", () => ({}));
vi.mock("@/lib/visual-builder/config", () => ({ builderConfig: {} }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a> }));
const actions = vi.hoisted(() => ({ saveLandingDraft: vi.fn(), publishLanding: vi.fn(), discardLandingDraft: vi.fn() }));
vi.mock("./actions", () => actions);

const { VisualEditor } = await import("./VisualEditor");

const props = {
  landingId: "landing1",
  title: "Landing",
  locale: "es" as const,
  publicPath: "/soluciones/landing",
  initialData: editedData,
  notice: null,
  version: "2026-11-24T10:00:00.000Z",
  published: false,
  hasDraft: false,
};

const click = async (name: string) => {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
  });
};

describe("VisualEditor", () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("ignores a second save while the first one is pending, so a double click does not report a false conflict", async () => {
    let finish: (value: { version: string }) => void = () => {};
    actions.saveLandingDraft.mockImplementation(() => new Promise((resolve) => (finish = resolve)));
    render(<VisualEditor {...props} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
      fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    });
    await act(async () => finish({ version: "2026-11-24T10:00:00.001Z" }));

    expect(actions.saveLandingDraft).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows an error and re-enables the buttons when the save action rejects", async () => {
    actions.saveLandingDraft.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    render(<VisualEditor {...props} />);
    await click("Guardar borrador");

    expect(screen.getByRole("alert").textContent).toContain("No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
    expect((screen.getByRole("button", { name: "Publicar" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("shows an error when the publish action rejects, and the next publish still runs", async () => {
    actions.publishLanding.mockRejectedValueOnce(new Error("boom"));
    actions.publishLanding.mockResolvedValueOnce({ ok: "Landing publicada.", version: "2026-11-24T10:05:00.000Z" });
    render(<VisualEditor {...props} />);
    await click("Publicar");
    expect(screen.getByRole("alert").textContent).toContain("No se pudo conectar con el servidor.");

    await click("Publicar");
    expect(screen.getByRole("status").textContent).toBe("Landing publicada.");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("sends the loaded version, then the version each successful save returns", async () => {
    actions.saveLandingDraft
      .mockResolvedValueOnce({ ok: "Borrador guardado.", version: "2026-11-24T10:01:00.000Z" })
      .mockResolvedValueOnce({ ok: "Borrador guardado.", version: "2026-11-24T10:02:00.000Z" });
    actions.publishLanding.mockResolvedValueOnce({ ok: "Landing publicada.", version: "2026-11-24T10:03:00.000Z" });
    render(<VisualEditor {...props} />);
    await click("Guardar borrador");
    await click("Guardar borrador");
    await click("Publicar");

    expect(actions.saveLandingDraft.mock.calls.map((call) => call[1])).toEqual(["2026-11-24T10:00:00.000Z", "2026-11-24T10:01:00.000Z"]);
    expect(actions.publishLanding.mock.calls[0][1]).toBe("2026-11-24T10:02:00.000Z");
  });

  it("keeps the version after a refused save, and shows the conflict", async () => {
    const conflict = "Alguien más guardó esta landing mientras la editabas. Recarga la página para ver la versión actual.";
    actions.saveLandingDraft.mockResolvedValueOnce({ errors: [conflict] }).mockResolvedValueOnce({ errors: [conflict] });
    render(<VisualEditor {...props} />);
    await click("Guardar borrador");
    expect(screen.getByRole("alert").textContent).toContain(conflict);
    await click("Guardar borrador");
    expect(actions.saveLandingDraft.mock.calls.map((call) => call[1])).toEqual([props.version, props.version]);
  });

  it("shows the start notice when the stored page failed validation", () => {
    render(<VisualEditor {...props} notice="Los bloques guardados de esta landing ya no son válidos." />);
    expect(screen.getByRole("status").textContent).toContain("Los bloques guardados de esta landing ya no son válidos.");
    fireEvent.click(screen.getByRole("button", { name: "Entendido" }));
    expect(screen.queryByRole("status")).toBeNull();
  });
});
