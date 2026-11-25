"use client";

import { useState, type ReactNode } from "react";
import type { ProjectType } from "@/lib/contact/contact-form";
import { HomeContactForm, type ProjectOption } from "./HomeContactForm";

export type ContactIntentOption = { id: string; label: string; message: string; projectType: ProjectType };

type HomeContactPanelProps = {
  intents: ContactIntentOption[];
  intentsLabel: string;
  projectOptions: ProjectOption[];
  showPending: boolean;
  // Direct contact details, rendered by the server under the intent message.
  aside: ReactNode;
};

// "¿Qué construimos?": an intent chip answers with what I need to know and preselects the project
// type of the real contact form next to it. The first intent ("Estoy empezando mi negocio") is
// selected from the start, so the server HTML already reads complete.
export function HomeContactPanel({ intents, intentsLabel, projectOptions, showPending, aside }: HomeContactPanelProps) {
  const [intentId, setIntentId] = useState(intents[0].id);
  const [projectType, setProjectType] = useState<ProjectType>(intents[0].projectType);
  const intent = intents.find((item) => item.id === intentId) ?? intents[0];

  return (
    <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
      <div className="flex flex-col gap-8">
        <div role="group" aria-label={intentsLabel} className="flex flex-wrap gap-2.5">
          {intents.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === intentId}
              onClick={() => {
                setIntentId(item.id);
                setProjectType(item.projectType);
              }}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-brand-950/35 px-4 text-sm font-medium text-brand-950 transition-colors hover:border-brand-950 aria-pressed:border-brand-950 aria-pressed:bg-brand-950 aria-pressed:text-brand-100"
            >
              {item.label}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="max-w-prose text-xl text-brand-950">
          {intent.message}
        </p>
        {aside}
      </div>
      <div data-x="ContactForm">
        <HomeContactForm projectOptions={projectOptions} projectType={projectType} onProjectType={setProjectType} showPending={showPending} />
      </div>
    </div>
  );
}
