"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useId, useState } from "react";
import { submitContact, type ContactState } from "@/app/[locale]/contacto/actions";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/atoms/ButtonLink";
import { Pending } from "@/components/atoms/Pending";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { MESSAGE_MAX_LENGTH, type ContactField } from "@/lib/contact/contact-form";
import { projectTypeForNeeds } from "@/lib/home/project-type";

type Need = { id: string; label: string };

const initialState: ContactState = { status: "idle" };
const fieldClass =
  "min-h-12 w-full rounded-control border-[1.5px] border-ink-line bg-ink-raised px-3.5 py-3 text-base text-on-ink transition-colors placeholder:text-on-ink-muted hover:border-on-ink/35 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/25 focus:outline-none aria-invalid:border-danger-soft";
const labelClass = "mb-2.5 block text-sm font-semibold";

// "Enviar otro mensaje" starts a fresh form: a new key gives the action a new, idle state.
// showPending: whether the placeholder about the response time is published (SHOW_PENDING_CONTENT).
export function HomeContactForm({ needs, showPending }: { needs: Need[]; showPending: boolean }) {
  const [round, setRound] = useState(0);
  return <ContactRound key={round} needs={needs} showPending={showPending} onAgain={() => setRound(round + 1)} />;
}

// Posts to the same server action as the contact page (validation, rate limit and storage live
// there). The needs map to its single project type; without JavaScript the form still posts,
// with "other" as the project type.
function ContactRound({ needs, showPending, onAgain }: { needs: Need[]; showPending: boolean; onAgain: () => void }) {
  const t = useTranslations("Home.contact");
  const contact = useTranslations("Contact");
  const locale = useLocale();
  const id = useId();
  const [state, action, pending] = useActionState(submitContact, initialState);
  const [picked, setPicked] = useState<string[]>([]);

  if (state.status === "success") {
    return (
      <div role="status" data-surface="ink" className="flex flex-col gap-5 rounded-3xl bg-ink p-6 text-on-ink md:p-9">
        <p className="mono-label text-brand-500">{t("success.label")}</p>
        <p className="font-display-tight text-4xl">{t("success.title")}</p>
        <p className="text-on-ink-muted">
          {t("success.text")}
          {showPending ? (
            <>
              {" "}
              <Pending>{t("success.pending")}</Pending>
            </>
          ) : null}
        </p>
        <button
          type="button"
          onClick={onAgain}
          className={cn(buttonBase, buttonSizes.lg, buttonVariants.secondary, "w-full cursor-pointer")}
        >
          {t("success.again")}
        </button>
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
      <p id={`${id}-${field}-error`} className="mt-2 text-sm font-medium text-danger-soft">
        {contact(`errors.${errors[field]}`)}
      </p>
    ) : null;
  const optional = <span className="font-normal text-on-ink-muted"> {t("optional")}</span>;

  return (
    <form
      action={action}
      noValidate
      aria-labelledby="t-cta"
      data-surface="ink"
      className="flex flex-col gap-5 rounded-3xl bg-ink p-6 text-on-ink md:p-9"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="projectType" value={projectTypeForNeeds(picked)} />
      {/* Honeypot: hidden from people and assistive technology, filled by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset>
        <legend className={labelClass}>
          {t("needsLegend")} <span className="font-normal text-on-ink-muted">{t("needsHint")}</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {needs.map((need) => {
            const on = picked.includes(need.id);
            return (
              <button
                key={need.id}
                type="button"
                aria-pressed={on}
                onClick={() => setPicked(on ? picked.filter((item) => item !== need.id) : [...picked, need.id])}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-[1.5px] border-ink-line px-4 text-sm font-medium transition-colors hover:border-on-ink aria-pressed:border-brand-500 aria-pressed:bg-brand-500 aria-pressed:text-ink"
              >
                {need.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${id}-message`} className={labelClass}>
          {t("message")}
        </label>
        <textarea
          {...fieldProps("message")}
          defaultValue={values.message}
          placeholder={t("messagePlaceholder")}
          required
          maxLength={MESSAGE_MAX_LENGTH}
          className={cn(fieldClass, "min-h-28 resize-y")}
        />
        {fieldError("message")}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className={labelClass}>
            {t("name")}
          </label>
          <input {...fieldProps("name")} defaultValue={values.name} type="text" autoComplete="name" required className={fieldClass} />
          {fieldError("name")}
        </div>
        <div>
          <label htmlFor={`${id}-email`} className={labelClass}>
            {t("email")}
          </label>
          <input {...fieldProps("email")} defaultValue={values.email} type="email" autoComplete="email" required className={fieldClass} />
          {fieldError("email")}
        </div>
        <div>
          <label htmlFor={`${id}-phone`} className={labelClass}>
            {t("phone")}
            {optional}
          </label>
          <input {...fieldProps("phone")} defaultValue={values.phone} type="tel" autoComplete="tel" className={fieldClass} />
          {fieldError("phone")}
        </div>
        <div>
          <label htmlFor={`${id}-company`} className={labelClass}>
            {t("company")}
            {optional}
          </label>
          <input {...fieldProps("company")} defaultValue={values.company} type="text" autoComplete="organization" className={fieldClass} />
          {fieldError("company")}
        </div>
      </div>

      <div>
        <div className="flex items-start gap-2.5 text-caption text-on-ink-muted">
          <input {...fieldProps("consent")} type="checkbox" required className="mt-px size-5 flex-none accent-brand-500" />
          <label htmlFor={`${id}-consent`}>
            {t.rich("consent", {
              link: (chunks) => (
                <Link href="/politica-de-privacidad" className="text-brand-500 underline underline-offset-2">
                  {chunks}
                </Link>
              ),
            })}
          </label>
        </div>
        {fieldError("consent")}
      </div>

      {state.status === "error" && state.form ? (
        <p role="alert" className="text-sm font-medium text-danger-soft">
          {contact(`errors.${state.form}`)}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        data-magnetic=""
        className={cn(buttonBase, buttonSizes.lg, buttonVariants.primary, "group w-full cursor-pointer", pending && "opacity-60")}
      >
        {pending ? contact("sending") : t("submit")}
        <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
          →
        </span>
      </button>
    </form>
  );
}
