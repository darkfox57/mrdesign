"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IMAGE_CONTENT_TYPES } from "@/lib/media/rules";
import { registerMediaUpload, requestMediaUpload } from "./actions";

type Line = { id: string; name: string; text: string; failed: boolean };

async function sha256Hex(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Uploads go straight from the browser to R2 with a URL the server signed for this exact file.
async function uploadOne(file: File): Promise<{ text: string; failed: boolean }> {
  const sha256 = await sha256Hex(file);
  const request = { sha256, size: file.size, contentType: file.type, name: file.name };
  const ticket = await requestMediaUpload(request);
  if (ticket.status === "error") return { text: ticket.error, failed: true };
  if (ticket.status === "existing") return { text: "Ya estaba en la biblioteca.", failed: false };

  const response = await fetch(ticket.url, { method: "PUT", headers: ticket.headers, body: file }).catch(() => null);
  if (!response?.ok) return { text: "No se pudo subir a R2. Prueba de nuevo.", failed: true };

  const result = await registerMediaUpload({ sha256, contentType: file.type, name: file.name });
  return "error" in result ? { text: result.error, failed: true } : { text: "Subida.", failed: false };
}

export function MediaUploader() {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    setBusy(true);
    const batch = files.map((file, index) => ({ id: `${Date.now()}-${index}`, name: file.name, text: "Subiendo…", failed: false }));
    setLines(batch);
    for (const [index, file] of files.entries()) {
      const outcome = await uploadOne(file).catch(() => ({ text: "No se pudo subir. Prueba de nuevo.", failed: true }));
      setLines((current) => current.map((line) => (line.id === batch[index].id ? { ...line, ...outcome } : line)));
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <label className="grid gap-2 text-sm font-medium text-ink">
        Subir imágenes
        <input
          type="file"
          multiple
          accept={IMAGE_CONTENT_TYPES.join(",")}
          disabled={busy}
          onChange={onChange}
          className="text-sm font-normal file:mr-3 file:min-h-11 file:rounded-control file:border-0 file:bg-brand-600 file:px-4 file:font-medium file:text-surface"
        />
      </label>
      <p className="mt-2 text-sm text-graphite">JPG, PNG, WebP, AVIF o GIF, hasta 5 MB. Una imagen que ya está en la biblioteca no se sube dos veces.</p>
      {lines.length > 0 ? (
        <ul className="mt-3 grid gap-1 text-sm">
          {lines.map((line) => (
            <li key={line.id} role={line.failed ? "alert" : "status"} className={line.failed ? "font-medium text-danger" : "text-ink"}>
              {line.name}: {line.text}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
