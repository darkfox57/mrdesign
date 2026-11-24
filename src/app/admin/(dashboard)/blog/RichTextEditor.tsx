"use client";

import Image from "@tiptap/extension-image";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";
import { MediaPicker } from "./MediaPicker";

// Only what sanitizePostHtml keeps: no underline or strike (they would vanish on save), headings
// h2-h4 (the page owns the h1), and tables so posts that arrive with them (for example through
// the ingest API) survive an edit.
const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3, 4] },
    strike: false,
    underline: false,
    // Tiptap would add target="_blank" and rel="nofollow" to every link, internal ones included.
    // null keeps each link's own attributes; the sanitizer adds rel noopener to _blank links.
    link: { openOnClick: false, autolink: true, defaultProtocol: "https", HTMLAttributes: { target: null, rel: null } },
  }),
  Image,
  Table.configure({ resizable: false }),
  TableRow,
  TableHeader,
  TableCell,
];

type Tool = { label: string; text: string; active?: (editor: Editor) => boolean; run: (editor: Editor) => void };

const tools: Tool[] = [
  { label: "Título 2", text: "H2", active: (e) => e.isActive("heading", { level: 2 }), run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: "Título 3", text: "H3", active: (e) => e.isActive("heading", { level: 3 }), run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: "Negrita", text: "B", active: (e) => e.isActive("bold"), run: (e) => e.chain().focus().toggleBold().run() },
  { label: "Cursiva", text: "I", active: (e) => e.isActive("italic"), run: (e) => e.chain().focus().toggleItalic().run() },
  { label: "Lista", text: "•", active: (e) => e.isActive("bulletList"), run: (e) => e.chain().focus().toggleBulletList().run() },
  { label: "Lista numerada", text: "1.", active: (e) => e.isActive("orderedList"), run: (e) => e.chain().focus().toggleOrderedList().run() },
  { label: "Cita", text: "“”", active: (e) => e.isActive("blockquote"), run: (e) => e.chain().focus().toggleBlockquote().run() },
  { label: "Código", text: "</>", active: (e) => e.isActive("codeBlock"), run: (e) => e.chain().focus().toggleCodeBlock().run() },
  { label: "Separador", text: "—", run: (e) => e.chain().focus().setHorizontalRule().run() },
  {
    label: "Enlace",
    text: "Enlace",
    active: (e) => e.isActive("link"),
    run: (e) => {
      const current = e.getAttributes("link").href as string | undefined;
      const href = window.prompt("URL del enlace (https://…). Déjala vacía para quitarlo.", current ?? "https://");
      if (href === null) return;
      if (href.trim() === "") e.chain().focus().extendMarkRange("link").unsetLink().run();
      else e.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
    },
  },
  { label: "Deshacer", text: "↶", run: (e) => e.chain().focus().undo().run() },
  { label: "Rehacer", text: "↷", run: (e) => e.chain().focus().redo().run() },
];

export function RichTextEditor({ initialHtml, invalid }: { initialHtml: string; invalid?: boolean }) {
  const [html, setHtml] = useState(initialHtml);
  const [pickerOpen, setPickerOpen] = useState(false);
  const editor = useEditor({
    extensions,
    content: initialHtml,
    // Rendered on the client only: avoids a hydration mismatch with the server HTML.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Contenido",
        ...(invalid ? { "aria-invalid": "true" } : {}),
        class: "post-content min-h-80 px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor: current }) => setHtml(current.getHTML()),
  });
  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => (current ? tools.map((tool) => tool.active?.(current) ?? false) : tools.map(() => false)),
  });

  return (
    <div className={`rounded-control border bg-surface ${invalid ? "border-brand-700" : "border-field"}`}>
      <input type="hidden" name="content" value={html} />
      <div role="toolbar" aria-label="Formato" className="flex flex-wrap gap-1 border-b border-line p-2">
        {tools.map((tool, index) => (
          <button
            key={tool.label}
            type="button"
            aria-label={tool.label}
            aria-pressed={tool.active ? Boolean(active?.[index]) : undefined}
            disabled={!editor}
            onClick={() => editor && tool.run(editor)}
            className="min-h-11 min-w-11 rounded-control px-2 text-sm font-medium text-ink hover:bg-paper aria-pressed:bg-brand-50 aria-pressed:text-brand-700 disabled:opacity-40"
          >
            {tool.text}
          </button>
        ))}
        <button
          type="button"
          aria-label="Insertar imagen"
          disabled={!editor}
          onClick={() => setPickerOpen(true)}
          className="min-h-11 rounded-control px-2 text-sm font-medium text-ink hover:bg-paper disabled:opacity-40"
        >
          Imagen
        </button>
      </div>
      <EditorContent editor={editor} />
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(media) => {
          editor?.chain().focus().setImage({ src: media.url, alt: media.alt }).run();
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
