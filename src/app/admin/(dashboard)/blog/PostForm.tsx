"use client";

import { useActionState, useState } from "react";
import { LOCALE_LABELS } from "@/lib/admin/posts";
import { SEO_DESCRIPTION_MAX, type PostFormInput } from "@/lib/admin/post-form";
import { routing } from "@/i18n/routing";
import { MediaPicker } from "./MediaPicker";
import { RichTextEditor } from "./RichTextEditor";
import { savePost, type SavePostState } from "./editor-actions";

export type CategoryOption = { id: string; name: string; locale: (typeof routing.locales)[number] };

const field = "min-h-11 rounded-control border border-field bg-surface px-3 font-normal";
const label = "grid gap-1.5 text-sm font-medium text-ink";

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <span id={id} className="text-sm font-medium text-brand-700">
      {message}
    </span>
  ) : null;
}

export function PostForm({
  postId,
  translationOf,
  initial,
  categories,
}: {
  postId?: string;
  // Id of the post this one translates: the language is fixed and the posts get linked.
  translationOf?: string;
  initial: PostFormInput;
  categories: CategoryOption[];
}) {
  const [state, action, pending] = useActionState<SavePostState, FormData>(savePost, {});
  const values = state.values ?? initial;
  const errors = state.fieldErrors ?? {};
  const [locale, setLocale] = useState(values.locale);
  const [cover, setCover] = useState(values.coverImageUrl);
  const [pickerOpen, setPickerOpen] = useState(false);
  const localeCategories = categories.filter((category) => category.locale === locale);
  const invalid = (name: keyof PostFormInput) => (errors[name] ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {});

  return (
    <form action={action} noValidate className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      {postId ? <input type="hidden" name="postId" value={postId} /> : null}
      {translationOf ? <input type="hidden" name="translationOf" value={translationOf} /> : null}
      <div className="grid content-start gap-5">
        <label className={label}>
          Título
          <input name="title" defaultValue={values.title} required maxLength={200} className={field} {...invalid("title")} />
          <FieldError id="title-error" message={errors.title} />
        </label>
        <label className={label}>
          Slug
          <input name="slug" defaultValue={values.slug} maxLength={200} placeholder="Se genera del título" className={field} {...invalid("slug")} />
          <FieldError id="slug-error" message={errors.slug} />
        </label>
        <label className={label}>
          Resumen
          <textarea name="excerpt" defaultValue={values.excerpt} required maxLength={300} rows={3} className={`${field} py-2`} {...invalid("excerpt")} />
          <FieldError id="excerpt-error" message={errors.excerpt} />
        </label>
        <div className="grid gap-1.5">
          <span className="text-sm font-medium text-ink">Contenido</span>
          <RichTextEditor initialHtml={values.content} invalid={Boolean(errors.content)} />
          <FieldError id="content-error" message={errors.content} />
        </div>
      </div>

      <aside className="grid content-start gap-5">
        <div className="grid gap-3 rounded-card border border-line bg-surface p-4">
          {state.error ? (
            <p role="alert" className="text-sm font-medium text-brand-700">
              {state.error}
            </p>
          ) : null}
          {state.ok ? (
            <p role="status" className="text-sm font-medium text-ink">
              {state.ok}
            </p>
          ) : null}
          {Object.keys(errors).length > 0 ? (
            <p role="alert" className="text-sm font-medium text-brand-700">
              Revisa los campos marcados.
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 rounded-control bg-brand-600 px-5 font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </div>

        <label className={label}>
          Idioma
          {postId || translationOf ? (
            <>
              <input type="hidden" name="locale" value={locale} />
              <span className="font-normal text-graphite">
                {LOCALE_LABELS[locale as keyof typeof LOCALE_LABELS]} ({postId ? "no se cambia después de crear el post" : "idioma de la traducción"})
              </span>
            </>
          ) : (
            <select name="locale" value={locale} onChange={(event) => setLocale(event.target.value)} className={field}>
              {routing.locales.map((option) => (
                <option key={option} value={option}>
                  {LOCALE_LABELS[option]}
                </option>
              ))}
            </select>
          )}
        </label>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium text-ink">Categorías</legend>
          {localeCategories.length === 0 ? <p className="text-sm text-graphite">No hay categorías en este idioma.</p> : null}
          {localeCategories.map((category) => (
            <label key={category.id} className="flex min-h-11 items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="categoryIds" value={category.id} defaultChecked={values.categoryIds.includes(category.id)} className="size-4" />
              {category.name}
            </label>
          ))}
        </fieldset>

        <div className="grid gap-2">
          <span className="text-sm font-medium text-ink">Portada</span>
          <input type="hidden" name="coverImageUrl" value={cover} />
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="Portada elegida" className="aspect-video w-full rounded-control border border-line bg-paper object-cover" />
          ) : null}
          <div className="flex gap-2">
            <button type="button" onClick={() => setPickerOpen(true)} className="min-h-11 rounded-control border border-line bg-surface px-4 text-sm font-medium text-ink hover:border-ink">
              Elegir portada
            </button>
            {cover ? (
              <button type="button" onClick={() => setCover("")} className="min-h-11 rounded-control px-3 text-sm font-medium text-brand-700">
                Quitar
              </button>
            ) : null}
          </div>
          <FieldError id="coverImageUrl-error" message={errors.coverImageUrl} />
          <label className={label}>
            Texto alternativo de la portada
            <input name="coverImageAlt" defaultValue={values.coverImageAlt} maxLength={300} className={field} />
          </label>
        </div>

        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium text-ink">SEO (opcional)</legend>
          <label className={label}>
            Título SEO
            <input name="seoTitle" defaultValue={values.seoTitle} maxLength={70} className={field} {...invalid("seoTitle")} />
            <FieldError id="seoTitle-error" message={errors.seoTitle} />
          </label>
          <label className={label}>
            Descripción SEO
            <textarea
              name="seoDescription"
              defaultValue={values.seoDescription}
              maxLength={SEO_DESCRIPTION_MAX}
              rows={3}
              className={`${field} py-2`}
              {...invalid("seoDescription")}
            />
            <FieldError id="seoDescription-error" message={errors.seoDescription} />
          </label>
        </fieldset>
      </aside>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(media) => {
          setCover(media.url);
          setPickerOpen(false);
        }}
      />
    </form>
  );
}
