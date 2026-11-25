"use client";

import { useActionState, useRef, useState } from "react";
import { routing } from "@/i18n/routing";
import {
  CASE_SEO_DESCRIPTION_MAX,
  CASE_SUMMARY_MAX,
  CASE_TEXT_MAX,
  MAX_CASE_GALLERY,
  MAX_CASE_METRICS,
  type CaseFormField,
  type CaseFormInput,
  type CaseImage,
  type CaseMetric,
} from "@/lib/admin/case-form";
import { LOCALE_LABELS } from "@/lib/admin/posts";
import { CASE_LINES, CASE_LINE_LABELS } from "@/lib/cases/lines";
import { MediaPicker } from "../blog/MediaPicker";
import { saveCaseAction, type SaveCaseState } from "./actions";

// min-w-0 and w-full: inputs shrink with their grid column instead of pushing it wider.
const field = "min-h-11 w-full min-w-0 rounded-control border border-field bg-surface px-3 font-normal";
const label = "grid min-w-0 gap-1.5 text-sm font-medium text-ink";
const secondaryButton = "min-h-11 rounded-control border border-line bg-surface px-4 text-sm font-medium text-ink hover:border-ink disabled:opacity-40";
const removeButton = "min-h-11 rounded-control px-3 text-sm font-medium text-brand-700";

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <span id={id} className="text-sm font-medium text-brand-700">
      {message}
    </span>
  ) : null;
}

// Repeated rows need a stable key while they are added and removed.
type Keyed<T> = T & { key: number };
function useRows<T>(initial: T[]) {
  const next = useRef(initial.length);
  const [rows, setRows] = useState<Keyed<T>[]>(() => initial.map((row, key) => ({ ...row, key })));
  return {
    rows,
    add: (row: T) => setRows((current) => [...current, { ...row, key: next.current++ }]),
    remove: (key: number) => setRows((current) => current.filter((row) => row.key !== key)),
    update: (key: number, change: Partial<T>) => setRows((current) => current.map((row) => (row.key === key ? { ...row, ...change } : row))),
  };
}

export function CaseForm({
  caseId,
  version,
  translationOf,
  published = false,
  initial,
}: {
  caseId?: string;
  // The case's updatedAt (ISO) as this page loaded it: a save only applies while the case still has
  // it. The page sends the new one after every successful save.
  version?: string;
  // Id of the case this one translates: the language is fixed and the cases get linked.
  translationOf?: string;
  published?: boolean;
  initial: CaseFormInput;
}) {
  const [state, action, pending] = useActionState<SaveCaseState, FormData>(saveCaseAction, {});
  const values = state.values ?? initial;
  const errors = state.fieldErrors ?? {};
  const [locale, setLocale] = useState(values.locale);
  const [cover, setCover] = useState(values.coverImageUrl);
  const [coverAlt, setCoverAlt] = useState(values.coverImageAlt);
  const metrics = useRows<CaseMetric>(values.metrics);
  const gallery = useRows<CaseImage>(values.gallery);
  const [picking, setPicking] = useState<"cover" | "gallery" | null>(null);
  const invalid = (name: CaseFormField) => (errors[name] ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {});

  return (
    <form action={action} noValidate className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      {caseId ? <input type="hidden" name="caseId" value={caseId} /> : null}
      {version ? <input type="hidden" name="version" value={version} /> : null}
      {translationOf ? <input type="hidden" name="translationOf" value={translationOf} /> : null}
      <div className="grid min-w-0 content-start gap-5">
        <div className="grid gap-5 sm:grid-cols-[1fr_8rem] sm:items-start">
          <label className={label}>
            Cliente o marca
            <input name="client" defaultValue={values.client} maxLength={120} className={field} {...invalid("client")} />
            <FieldError id="client-error" message={errors.client} />
          </label>
          <label className={label}>
            Año
            <input name="year" defaultValue={values.year} inputMode="numeric" maxLength={4} className={field} {...invalid("year")} />
            <FieldError id="year-error" message={errors.year} />
          </label>
        </div>
        <label className={label}>
          Título del caso
          <input name="title" defaultValue={values.title} maxLength={200} className={field} {...invalid("title")} />
          <FieldError id="title-error" message={errors.title} />
        </label>
        <label className={label}>
          Slug
          <input name="slug" defaultValue={values.slug} maxLength={200} placeholder="Se genera del título o del cliente" className={field} {...invalid("slug")} />
          <FieldError id="slug-error" message={errors.slug} />
        </label>
        <label className={label}>
          Resumen
          <span className="font-normal text-graphite">Un párrafo que responde primero qué se hizo y qué se logró. Se usa en tarjetas y buscadores.</span>
          <textarea name="summary" defaultValue={values.summary} maxLength={CASE_SUMMARY_MAX} rows={3} className={`${field} py-2`} {...invalid("summary")} />
          <FieldError id="summary-error" message={errors.summary} />
        </label>
        {(
          [
            ["challenge", "El reto"],
            ["solution", "La solución"],
            ["result", "El resultado"],
          ] as const
        ).map(([name, title]) => (
          <label key={name} className={label}>
            {title}
            <textarea name={name} defaultValue={values[name]} maxLength={CASE_TEXT_MAX} rows={5} className={`${field} py-2`} {...invalid(name)} />
            <FieldError id={`${name}-error`} message={errors[name]} />
          </label>
        ))}

        <fieldset className="grid gap-3" {...(errors.metrics ? { "aria-describedby": "metrics-error" } : {})}>
          <legend className="text-sm font-medium text-ink">Métricas (opcional)</legend>
          <p className="text-sm text-graphite">Solo cifras que se puedan comprobar: escribe de dónde sale cada una.</p>
          {metrics.rows.map((metric, index) => (
            <div key={metric.key} className="grid gap-3 rounded-card border border-line bg-surface p-3 sm:grid-cols-[1fr_8rem_1fr_auto] sm:items-end">
              <label className={label}>
                Métrica {index + 1}
                <input name="metricLabel" value={metric.label} onChange={(event) => metrics.update(metric.key, { label: event.target.value })} maxLength={80} className={field} />
              </label>
              <label className={label}>
                Valor
                <input name="metricValue" value={metric.value} onChange={(event) => metrics.update(metric.key, { value: event.target.value })} maxLength={40} className={field} />
              </label>
              <label className={label}>
                Cómo se verifica
                <input name="metricSource" value={metric.source} onChange={(event) => metrics.update(metric.key, { source: event.target.value })} maxLength={200} className={field} />
              </label>
              <button type="button" onClick={() => metrics.remove(metric.key)} aria-label={`Quitar la métrica ${index + 1}`} className={removeButton}>
                Quitar
              </button>
            </div>
          ))}
          <div>
            <button type="button" disabled={metrics.rows.length >= MAX_CASE_METRICS} onClick={() => metrics.add({ label: "", value: "", source: "" })} className={secondaryButton}>
              Agregar métrica
            </button>
          </div>
          <FieldError id="metrics-error" message={errors.metrics} />
        </fieldset>

        <label className={label}>
          Tecnologías
          <span className="font-normal text-graphite">Separadas por comas.</span>
          <textarea name="stack" defaultValue={values.stack} rows={2} maxLength={2000} className={`${field} py-2`} {...invalid("stack")} />
          <FieldError id="stack-error" message={errors.stack} />
        </label>
        <label className={label}>
          Sitio web (opcional)
          <input name="websiteUrl" type="url" defaultValue={values.websiteUrl} placeholder="https://" className={field} {...invalid("websiteUrl")} />
          <FieldError id="websiteUrl-error" message={errors.websiteUrl} />
        </label>
      </div>

      <aside className="grid min-w-0 content-start gap-5">
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
            name="intent"
            value="save"
            disabled={pending}
            className={
              published
                ? "min-h-11 rounded-control bg-brand-600 px-5 font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
                : "min-h-11 rounded-control border border-line bg-surface px-5 font-medium text-ink hover:border-ink disabled:opacity-60"
            }
          >
            {pending ? "Guardando…" : published ? "Guardar cambios" : "Guardar borrador"}
          </button>
          {published ? (
            <p className="text-sm text-graphite">El caso está publicado: cada cambio tiene que cumplir lo que pide la publicación.</p>
          ) : (
            <button
              type="submit"
              name="intent"
              value="publish"
              disabled={pending}
              className="min-h-11 rounded-control bg-brand-600 px-5 font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              Guardar y publicar
            </button>
          )}
        </div>

        <div className="grid gap-2 rounded-card border border-line bg-surface p-4">
          <label className="flex min-h-11 items-start gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              name="clientAuthorized"
              defaultChecked={values.clientAuthorized}
              className="mt-1 size-4"
              {...invalid("clientAuthorized")}
            />
            El cliente autorizó publicar este caso
          </label>
          <p className="text-sm text-graphite">Sin esta autorización el caso no se publica.</p>
          <FieldError id="clientAuthorized-error" message={errors.clientAuthorized} />
        </div>

        <label className={label}>
          Idioma
          {caseId || translationOf ? (
            <>
              <input type="hidden" name="locale" value={locale} />
              <span className="font-normal text-graphite">
                {LOCALE_LABELS[locale as keyof typeof LOCALE_LABELS]} ({caseId ? "no se cambia después de crear el caso" : "idioma de la traducción"})
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

        <fieldset className="grid gap-1" {...(errors.lines ? { "aria-describedby": "lines-error" } : {})}>
          <legend className="text-sm font-medium text-ink">Líneas de trabajo</legend>
          {CASE_LINES.map((line) => (
            <label key={line} className="flex min-h-11 items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="lines" value={line} defaultChecked={values.lines.includes(line)} className="size-4" />
              {CASE_LINE_LABELS[line]}
            </label>
          ))}
          <FieldError id="lines-error" message={errors.lines} />
        </fieldset>

        <div className="grid gap-2">
          <span className="text-sm font-medium text-ink">Portada</span>
          <input type="hidden" name="coverImageUrl" value={cover} />
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="Portada elegida" className="aspect-video w-full rounded-control border border-line bg-paper object-cover" />
          ) : null}
          <div className="flex gap-2">
            <button type="button" onClick={() => setPicking("cover")} className={secondaryButton}>
              Elegir portada
            </button>
            {cover ? (
              <button type="button" onClick={() => setCover("")} className={removeButton}>
                Quitar
              </button>
            ) : null}
          </div>
          <FieldError id="coverImageUrl-error" message={errors.coverImageUrl} />
          <label className={label}>
            Texto alternativo de la portada
            <input name="coverImageAlt" value={coverAlt} onChange={(event) => setCoverAlt(event.target.value)} maxLength={300} className={field} {...invalid("coverImageAlt")} />
            <FieldError id="coverImageAlt-error" message={errors.coverImageAlt} />
          </label>
        </div>

        <fieldset className="grid gap-3" {...(errors.gallery ? { "aria-describedby": "gallery-error" } : {})}>
          <legend className="text-sm font-medium text-ink">Galería (opcional)</legend>
          {gallery.rows.map((image, index) => (
            <div key={image.key} className="grid gap-2 rounded-card border border-line bg-surface p-3">
              <input type="hidden" name="galleryUrl" value={image.url} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" className="aspect-video w-full rounded-control bg-paper object-cover" />
              <label className={label}>
                Texto alternativo de la imagen {index + 1}
                <input name="galleryAlt" value={image.alt} onChange={(event) => gallery.update(image.key, { alt: event.target.value })} maxLength={300} className={field} />
              </label>
              <button type="button" onClick={() => gallery.remove(image.key)} aria-label={`Quitar la imagen ${index + 1}`} className={`${removeButton} justify-self-start`}>
                Quitar
              </button>
            </div>
          ))}
          <div>
            <button type="button" disabled={gallery.rows.length >= MAX_CASE_GALLERY} onClick={() => setPicking("gallery")} className={secondaryButton}>
              Agregar imagen
            </button>
          </div>
          <FieldError id="gallery-error" message={errors.gallery} />
        </fieldset>

        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium text-ink">Orden en el portafolio</legend>
          <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="featured" defaultChecked={values.featured} className="size-4" />
            Destacado
          </label>
          <label className={label}>
            Posición
            <span className="font-normal text-graphite">Los números menores van primero.</span>
            <input name="sortOrder" defaultValue={values.sortOrder} inputMode="numeric" className={field} {...invalid("sortOrder")} />
            <FieldError id="sortOrder-error" message={errors.sortOrder} />
          </label>
        </fieldset>

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
              maxLength={CASE_SEO_DESCRIPTION_MAX}
              rows={3}
              className={`${field} py-2`}
              {...invalid("seoDescription")}
            />
            <FieldError id="seoDescription-error" message={errors.seoDescription} />
          </label>
        </fieldset>
      </aside>

      <MediaPicker
        open={picking !== null}
        onClose={() => setPicking(null)}
        onSelect={(media) => {
          if (picking === "cover") {
            setCover(media.url);
            if (!coverAlt) setCoverAlt(media.alt);
          } else if (picking === "gallery" && !gallery.rows.some((image) => image.url === media.url)) {
            gallery.add({ url: media.url, alt: media.alt });
          }
          setPicking(null);
        }}
      />
    </form>
  );
}
