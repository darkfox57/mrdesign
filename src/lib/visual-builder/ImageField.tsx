"use client";

import { useState } from "react";
import { MediaPicker } from "@/app/admin/(dashboard)/blog/MediaPicker";

// Puck custom field: picks an image from the R2 library with the same picker the post editor
// uses. Stores the image URL; the alternative text is a separate field of the block.
export function ImageField({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="grid gap-2">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element -- library thumbnail inside the editor
        <img src={value} alt="Imagen elegida" className="aspect-video w-full rounded-control border border-line object-cover" />
      ) : (
        <p className="text-sm text-graphite">Sin imagen.</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-11 rounded-control border border-field bg-surface px-4 text-sm font-medium text-ink hover:border-ink"
        >
          {value ? "Cambiar imagen" : "Elegir imagen"}
        </button>
        {value ? (
          <button type="button" onClick={() => onChange("")} className="min-h-11 rounded-control px-4 text-sm font-medium text-danger">
            Quitar
          </button>
        ) : null}
      </div>
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(media) => {
          onChange(media.url);
          setOpen(false);
        }}
      />
    </div>
  );
}
