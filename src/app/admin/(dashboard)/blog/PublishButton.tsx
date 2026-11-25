"use client";

import { useActionState } from "react";
import { setPublication, type PublicationState } from "./actions";

type PublicationAction = (state: PublicationState, formData: FormData) => Promise<PublicationState>;

// The blog's publish toggle. Other modules pass their own server action and the name of the id field
// it reads (the cases list passes `caseId`).
export function PublishButton({
  postId,
  title,
  published,
  action: publicationAction = setPublication,
  idField = "postId",
}: {
  postId: string;
  title: string;
  published: boolean;
  action?: PublicationAction;
  idField?: string;
}) {
  const [state, action, pending] = useActionState<PublicationState, FormData>(publicationAction, {});
  const verb = published ? "Despublicar" : "Publicar";

  return (
    <form action={action} className="grid gap-1">
      <input type="hidden" name={idField} value={postId} />
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
