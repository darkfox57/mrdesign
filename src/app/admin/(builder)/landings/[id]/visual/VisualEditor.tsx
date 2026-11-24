"use client";

import { createUsePuck, Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import type { Locale } from "@/i18n/routing";
import { builderConfig } from "@/lib/visual-builder/config";
import { builderDictionary } from "@/lib/visual-builder/dictionary";
import { discardLandingDraft, publishLanding, saveLandingDraft, type BuilderActionState } from "./actions";

// The preview runs in an iframe: give it the page's root classes, which carry the site fonts.
function IframeWithSiteClasses({ children, document: frame }: { children: ReactNode; document?: Document }) {
  useEffect(() => {
    if (!frame) return;
    // Writing to the iframe's DOM is the point of this effect: it is an external document.
    // eslint-disable-next-line react-hooks/immutability
    frame.documentElement.className = window.document.documentElement.className;
    frame.body.className = window.document.body.className;
  }, [frame]);
  return <>{children}</>;
}

const usePuck = createUsePuck<typeof builderConfig>();
const headerButton =
  "inline-flex min-h-10 items-center rounded-control border border-field bg-surface px-3 text-sm font-medium whitespace-nowrap text-ink hover:border-ink disabled:opacity-50";

type HeaderActionsProps = {
  children: ReactNode;
  pending: boolean;
  hasDraft: boolean;
  published: boolean;
  onPublish: (data: Data) => void;
  onDiscard: () => void;
  canLeave: () => boolean;
};

// Inside Puck, so it can read the data being edited.
function HeaderActions({ children, pending, hasDraft, published, onPublish, onDiscard, canLeave }: HeaderActionsProps) {
  const data = usePuck((state) => state.appState.data);
  return (
    <>
      <span className="text-sm text-graphite">
        {published ? "Publicada" : "Sin publicar"}
        {hasDraft ? " · Hay cambios sin publicar" : ""}
      </span>
      <Link href="/admin/landings" className={headerButton} onClick={(event) => (canLeave() ? undefined : event.preventDefault())}>
        Volver a las landings
      </Link>
      <button type="button" className={headerButton} disabled={pending || !hasDraft} onClick={onDiscard}>
        Descartar borrador
      </button>
      {children}
      <button type="button" className={headerButton} disabled={pending} onClick={() => onPublish(data as Data)}>
        Publicar
      </button>
    </>
  );
}

type VisualEditorProps = {
  landingId: string;
  title: string;
  locale: Locale;
  // The landing's public address, shown next to its title in the editor header.
  publicPath: string;
  initialData: Data;
  // Why the editor did not start from the stored page (it failed validation), or null.
  notice: string | null;
  // The landing's version as loaded; each successful write returns the next one.
  version: string;
  published: boolean;
  hasDraft: boolean;
};

// A rejected action (network error, server error) is shown like a refused save, never left unhandled.
const UNREACHABLE = "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";

export function VisualEditor({
  landingId,
  title,
  locale,
  publicPath,
  initialData,
  notice: initialNotice,
  version: initialVersion,
  published: initiallyPublished,
  hasDraft: initialDraft,
}: VisualEditorProps) {
  const [result, setResult] = useState<BuilderActionState | null>(null);
  const [notice, setNotice] = useState(initialNotice);
  // Kept in a ref so the action reads the latest version even from a callback Puck captured earlier.
  const version = useRef(initialVersion);
  const [hasDraft, setHasDraft] = useState(initialDraft);
  const [published, setPublished] = useState(initiallyPublished);
  const [pending, startTransition] = useTransition();
  // Unsaved edits: set by Puck's onChange, cleared by a successful save or publish.
  const dirty = useRef(false);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const run = (action: (version: string) => Promise<BuilderActionState>, onSuccess: () => void) =>
    startTransition(async () => {
      let outcome: BuilderActionState;
      try {
        outcome = await action(version.current);
      } catch {
        outcome = { errors: [UNREACHABLE] };
      }
      setResult(outcome);
      if (outcome.errors?.length) return;
      if (outcome.version) version.current = outcome.version;
      onSuccess();
    });

  const save = (data: Data) =>
    run((current) => saveLandingDraft(landingId, current, data), () => {
      dirty.current = false;
      setHasDraft(true);
    });

  const publish = (data: Data) =>
    run((current) => publishLanding(landingId, current, data), () => {
      dirty.current = false;
      setHasDraft(false);
      setPublished(true);
    });

  // A client-side navigation does not fire beforeunload, so the link asks itself.
  const canLeave = () => !dirty.current || window.confirm("Hay cambios sin guardar. ¿Salir igual?");

  const discard = () => {
    if (!window.confirm("¿Descartar el borrador? El editor vuelve a lo publicado.")) return;
    run((current) => discardLandingDraft(landingId, current), () => {
      dirty.current = false;
      window.location.reload();
    });
  };

  return (
    <div className="h-svh">
      {notice ? (
        // Bottom left, clear of Puck's header and of the save result (bottom right).
        <div role="status" className="fixed bottom-4 left-4 z-1000 flex max-w-md items-start gap-3 rounded-control bg-ink px-4 py-3 text-sm text-white shadow-lg">
          <p>{notice}</p>
          <button type="button" className="shrink-0 font-medium underline underline-offset-2" onClick={() => setNotice(null)}>
            Entendido
          </button>
        </div>
      ) : null}
      {result?.ok ? (
        <p role="status" className="fixed right-4 bottom-4 z-1000 rounded-control bg-ink px-4 py-2 text-sm text-white shadow-lg">
          {result.ok}
        </p>
      ) : null}
      {result?.errors?.length ? (
        <div role="alert" className="fixed right-4 bottom-4 z-1000 max-w-md rounded-control bg-danger px-4 py-3 text-sm text-white shadow-lg">
          <p className="font-medium">No se guardó. Revisa:</p>
          <ul className="mt-1 list-disc pl-5">
            {result.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <Puck
        config={builderConfig}
        data={initialData}
        dictionary={builderDictionary}
        // Blocks read the landing's language from here (their internal links).
        metadata={{ locale }}
        headerTitle={title}
        headerPath={publicPath}
        onChange={() => {
          dirty.current = true;
        }}
        // Puck's own header button, labelled "Guardar borrador" in the dictionary.
        onPublish={save}
        overrides={{
          iframe: IframeWithSiteClasses,
          headerActions: ({ children }) => (
            <HeaderActions pending={pending} hasDraft={hasDraft} published={published} onPublish={publish} onDiscard={discard} canLeave={canLeave}>
              {children}
            </HeaderActions>
          ),
        }}
      />
    </div>
  );
}
