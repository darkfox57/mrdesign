"use client";

import { useActionState } from "react";
import { routing, type Locale } from "@/i18n/routing";
import { LOCALE_LABELS } from "@/lib/admin/posts";
import { createLanding, type CreateLandingState } from "./actions";

const field = "min-h-11 rounded-control border border-field bg-surface px-3 font-normal";
const label = "grid gap-1.5 text-sm font-medium text-ink";

// Language, title and slug. A translation has its language fixed by the page.
export function NewLandingForm({ translationOf, locale }: { translationOf?: string; locale?: Locale }) {
  const [state, action, pending] = useActionState<CreateLandingState, FormData>(createLanding, {});
  const values = state.values ?? {};

  return (
    <form action={action} className="grid max-w-xl gap-5 rounded-card border border-line bg-surface p-5">
      {translationOf && locale ? (
        <>
          <input type="hidden" name="translationOf" value={translationOf} />
          <input type="hidden" name="locale" value={locale} />
        </>
      ) : (
        <label className={label}>
          Idioma
          <select name="locale" defaultValue={values.locale || routing.defaultLocale} className={field}>
            {routing.locales.map((option) => (
              <option key={option} value={option}>
                {LOCALE_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className={label}>
        Título
        <input name="title" required maxLength={200} defaultValue={values.title} className={field} />
      </label>
      <div className="grid gap-1.5">
        <label className={label}>
          Slug
          <input name="slug" maxLength={80} defaultValue={values.slug} aria-describedby="slug-help" className={field} />
        </label>
        {/* Outside the label, so its text is the field's description and not part of its name. */}
        <p id="slug-help" className="text-sm text-graphite">
          La parte final de la dirección. Si lo dejas vacío, se arma con el título.
        </p>
      </div>
      {state.errors ? (
        <ul role="alert" className="grid gap-1 text-sm font-medium text-brand-700">
          {state.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 justify-self-start rounded-control bg-brand-600 px-5 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        Crear y abrir el editor visual
      </button>
    </form>
  );
}
