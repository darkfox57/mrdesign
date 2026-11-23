import { ButtonLink } from "@/components/atoms/ButtonLink";

type ClosingCtaProps = { title: string; text: string; button: string };

export function ClosingCta({ title, text, button }: ClosingCtaProps) {
  return (
    <section aria-labelledby="closing-cta-title" className="site-container py-20 lg:py-28">
      <div className="grid gap-8 border-t-4 border-brand-500 pt-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <h2 id="closing-cta-title" className="text-display">
          {title}
        </h2>
        <div>
          <p className="text-lead text-graphite">{text}</p>
          <ButtonLink href="/contacto" className="mt-6">
            {button}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
