"use client";

import { CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useId } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { MESSAGE_MAX_LENGTH, type ContactField } from "@/lib/contact/contact-form";
import { submitContact, type ContactState } from "./actions";

type Option = { value: string; label: string };

const initialState: ContactState = { status: "idle" };
const inputClass =
  "w-full min-h-11 rounded-control border border-field bg-surface px-3 py-2 text-ink aria-invalid:border-danger";

// Works without JavaScript too: the form posts straight to the server action.
export function ContactForm({ projectOptions }: { projectOptions: Option[] }) {
  const t = useTranslations("Contact");
  const locale = useLocale();
  const id = useId();
  const [state, action, pending] = useActionState(submitContact, initialState);

  if (state.status === "success") {
    return (
      <div role="status" className="rounded-card border border-line bg-surface p-8">
        <CheckCircle2 aria-hidden="true" className="size-8 text-success" />
        <h2 className="text-title mt-4">{t("success.title")}</h2>
        <p className="mt-2 text-graphite">{t("success.text")}</p>
      </div>
    );
  }

  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  const values = state.status === "error" ? state.values : {};
  const fieldProps = (field: ContactField) => ({
    id: `${id}-${field}`,
    name: field,
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${id}-${field}-error` : undefined,
  });
  const fieldError = (field: ContactField) =>
    errors[field] ? (
      <p id={`${id}-${field}-error`} className="text-sm font-medium text-danger">
        {t(`errors.${errors[field]}`)}
      </p>
    ) : null;
  const label = (field: Exclude<ContactField, "consent">, optional = false) => (
    <label htmlFor={`${id}-${field}`} className="text-sm font-semibold">
      {t(`fields.${field}`)}
      {optional ? <span className="font-normal text-graphite"> ({t("fields.optional")})</span> : null}
    </label>
  );

  return (
    <form action={action} noValidate className="grid gap-5 rounded-card border border-line bg-surface p-6 sm:p-8">
      <input type="hidden" name="locale" value={locale} />
      {/* Honeypot: hidden from people and assistive technology, filled by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid content-start gap-1.5">
          {label("name")}
          <input {...fieldProps("name")} defaultValue={values.name} autoComplete="name" required className={inputClass} />
          {fieldError("name")}
        </div>
        <div className="grid content-start gap-1.5">
          {label("email")}
          <input
            {...fieldProps("email")}
            defaultValue={values.email}
            type="email"
            autoComplete="email"
            required
            className={inputClass}
          />
          {fieldError("email")}
        </div>
        <div className="grid content-start gap-1.5">
          {label("company", true)}
          <input {...fieldProps("company")} defaultValue={values.company} autoComplete="organization" className={inputClass} />
          {fieldError("company")}
        </div>
        <div className="grid content-start gap-1.5">
          {label("phone", true)}
          <input {...fieldProps("phone")} defaultValue={values.phone} type="tel" autoComplete="tel" className={inputClass} />
          {fieldError("phone")}
        </div>
      </div>

      <div className="grid gap-1.5">
        {label("projectType")}
        <select {...fieldProps("projectType")} defaultValue={values.projectType ?? ""} required className={inputClass}>
          <option value="" disabled>
            {t("fields.projectTypePlaceholder")}
          </option>
          {projectOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {fieldError("projectType")}
      </div>

      <div className="grid gap-1.5">
        {label("message")}
        <textarea
          {...fieldProps("message")}
          defaultValue={values.message}
          rows={5}
          required
          maxLength={MESSAGE_MAX_LENGTH}
          className={inputClass}
        />
        {fieldError("message")}
      </div>

      <div className="grid gap-1.5">
        <div className="flex items-start gap-3">
          <input {...fieldProps("consent")} type="checkbox" required className="mt-1 size-5 shrink-0 accent-brand-600" />
          <label htmlFor={`${id}-consent`} className="text-sm">
            {t("fields.consentBefore")}{" "}
            <Link href="/politica-de-privacidad" className="font-semibold text-brand-600 underline underline-offset-2">
              {t("fields.consentLink")}
            </Link>
            {t("fields.consentAfter")}
          </label>
        </div>
        {fieldError("consent")}
      </div>

      {state.status === "error" && state.form ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {t(`errors.${state.form}`)}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className={cn(
          "min-h-11 w-full rounded-control bg-brand-600 px-6 font-semibold text-white transition-colors hover:bg-brand-700 sm:w-fit",
          pending && "opacity-60",
        )}
      >
        {pending ? t("sending") : t("submit")}
      </button>
    </form>
  );
}
