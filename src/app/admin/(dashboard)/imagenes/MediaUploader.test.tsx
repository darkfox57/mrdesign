import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("./actions", () => ({
  requestMediaUpload: vi.fn(async () => ({ status: "upload", url: "https://r2.test/media/x.png", headers: { "content-type": "image/png" } })),
  registerMediaUpload: vi.fn(async () => ({ ok: true })),
}));

const { registerMediaUpload } = await import("./actions");
const { MediaUploader } = await import("./MediaUploader");

// A PUT that never answers: it only ends when its signal aborts, like a stalled connection.
function stallingFetch(signals: AbortSignal[]) {
  return vi.fn((_url: string, init?: RequestInit) => {
    const signal = init?.signal;
    if (signal) signals.push(signal);
    return new Promise<Response>((_, reject) => signal?.addEventListener("abort", () => reject(signal.reason)));
  });
}

describe("MediaUploader", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("cancels an upload that takes too long, explains it and lets the user pick files again", async () => {
    const signals: AbortSignal[] = [];
    vi.stubGlobal("fetch", stallingFetch(signals));
    render(<MediaUploader uploadTimeoutMs={30} />);
    const input = screen.getByLabelText("Subir imágenes") as HTMLInputElement;

    fireEvent.change(input, { target: { files: [new File([new Uint8Array([1, 2, 3])], "lenta.png", { type: "image/png" })] } });
    await waitFor(() => expect(input.disabled).toBe(true));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("lenta.png: La subida tardó demasiado y se canceló. Revisa tu conexión y prueba de nuevo.");
    expect(signals).toHaveLength(1);
    expect(signals[0]?.aborted).toBe(true);
    expect(registerMediaUpload).not.toHaveBeenCalled();
    await waitFor(() => expect(input.disabled).toBe(false));
  });
});
