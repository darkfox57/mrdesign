"use client";

import type { ComponentProps } from "react";
import dynamic from "next/dynamic";
import type { VisualEditor as VisualEditorComponent } from "./VisualEditor";

// Puck only renders in the browser.
const VisualEditor = dynamic(() => import("./VisualEditor").then((module) => module.VisualEditor), {
  ssr: false,
  loading: () => <p className="p-8 text-graphite">Cargando el editor…</p>,
});

export function EditorLoader(props: ComponentProps<typeof VisualEditorComponent>) {
  return <VisualEditor {...props} />;
}
