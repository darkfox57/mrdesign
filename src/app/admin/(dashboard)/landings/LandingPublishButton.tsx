"use client";

import { useActionState } from "react";
import { setLandingPublication, type LandingPublicationState } from "./actions";

export function LandingPublishButton({ landingId, title, published }: { landingId: string; title: string; published: boolean }) {
  const [state, action, pending] = useActionState<LandingPublicationState, FormData>(setLandingPublication, {});
  const verb = published ? "Despublicar" : "Publicar";

  return (
    <form action={action} className="grid gap-1">
      <input type="hidden" name="landingId" value={landingId} />
      <input type="hidden" name="intent" value={published ? "unpublish" : "publish"} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`${verb} ${title}`}
        className={`min-h-11 rounded-control px-4 text-sm font-medium whitespace-nowrap disabled:opacity-60 ${
          published ? "border border-line text-ink hover:border-ink" : "bg-brand-600 text-white hover:bg-brand-700"
        }`}
      >
        {verb}
      </button>
      {state.error ? (
        <p role="alert" className="text-sm font-medium text-brand-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
