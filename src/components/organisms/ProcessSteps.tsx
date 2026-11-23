type Step = { title: string; text: string };

// The process is a real sequence, so the steps are numbered.
export function ProcessSteps({ title, steps }: { title: string; steps: Step[] }) {
  return (
    <section aria-labelledby="process-title" className="bg-ink text-on-ink">
      <div className="site-container py-20 lg:py-28">
        <h2 id="process-title" className="text-headline text-white">
          {title}
        </h2>
        <ol className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="border-t border-ink-line pt-6">
              <span aria-hidden="true" className="text-headline block text-brand-500">
                {index + 1}
              </span>
              <h3 className="text-title mt-3 text-white">{step.title}</h3>
              <p className="mt-2 text-on-ink-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
