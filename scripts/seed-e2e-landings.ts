// Landing builder fixtures for the e2e tests: a published landing with every block type and its
// English translation, a published landing with no translation, a draft with blocks, and a draft
// with no page yet. The specs only read them: a spec that edits, publishes or deletes a landing
// creates its own row. Every stored page passes validateBuilderData. Idempotent (each run resets
// them), and refuses to run against anything but the local docker database.
import "dotenv/config";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { isLocalDatabase } from "@/lib/is-local-database";
import { validateBuilderData } from "@/lib/visual-builder/validate";

type Locale = "es" | "en";
type Block = { type: string; props: Record<string, unknown> };

const PUBLISHED_AT = new Date("2026-02-01T12:00:00Z");

const hero = (id: string, title: string, lead: string, contact: string, side: Block[] = []): Block => ({
  type: "Hero",
  props: {
    id,
    eyebrow: "Shopify",
    title,
    lead,
    primaryLabel: contact,
    primaryHref: "/contacto",
    secondaryLabel: "",
    secondaryHref: "",
    background: "paper",
    side,
  },
});

const button = (id: string, label: string, href: string, variant: "primary" | "secondary" = "primary"): Block => ({
  type: "Button",
  props: { id, label, href, variant, align: "left" },
});

const textImage = (id: string, title: string, text: string): Block => ({
  type: "TextImage",
  props: { id, title, text, imageUrl: "", imageAlt: "", imageSide: "right", background: "paper" },
});

const faq = (id: string, title: string, items: [string, string][]): Block => ({
  type: "Faq",
  props: { id, title, background: "surface", items: items.map(([question, answer]) => ({ question, answer })) },
});

const pages: Record<string, Block[]> = {
  es: [
    hero("hero", "Tu tienda Shopify, lista para vender", "Diseño, catálogo, pagos y envíos configurados para que empieces a vender en semanas.", "Cuéntame tu proyecto", [
      textImage("hero-side", "Entrega en cuatro semanas", "Con tu catálogo cargado y los pagos probados."),
    ]),
    {
      type: "Cards",
      props: {
        id: "cards",
        title: "Lo que incluye",
        intro: "Todo lo que necesitas para abrir la tienda.",
        background: "surface",
        columns: "3",
        items: [
          { title: "Tema a la medida", text: "Tu marca, no una plantilla." },
          { title: "Pagos y envíos", text: "Configurados y probados con pedidos reales." },
          { title: "Capacitación", text: "Aprendes a cargar productos y gestionar pedidos." },
        ],
      },
    },
    {
      type: "Columns",
      props: {
        id: "cols",
        ratio: "2-1",
        background: "ink",
        left: [textImage("cols-text", "Migración desde otra plataforma", "Llevo tus productos, clientes y pedidos sin perder posiciones en buscadores.")],
        right: [button("cols-button", "Ver servicios", "/servicios", "secondary")],
      },
    },
    faq("faq", "Preguntas frecuentes", [
      ["¿Cuánto tarda una tienda Shopify?", "Entre tres y seis semanas, según el catálogo."],
      ["¿Puedo administrarla yo?", "Sí. Te enseño a cargar productos y gestionar pedidos."],
      ["¿Incluye el plan de Shopify?", "No. El plan lo pagas directamente a Shopify."],
    ]),
    {
      type: "Cta",
      props: { id: "cta", title: "¿Empezamos tu tienda?", text: "Te respondo en un día hábil.", buttonLabel: "Escríbeme", buttonHref: "/contacto", background: "brand" },
    },
  ],
  en: [
    hero("hero", "Your Shopify store, ready to sell", "Design, catalog, payments and shipping set up so you start selling in weeks.", "Tell me about your project"),
    faq("faq", "Frequently asked questions", [
      ["How long does a Shopify store take?", "Three to six weeks, depending on the catalog."],
      ["Can I run it myself?", "Yes. I show you how to add products and handle orders."],
      ["Is the Shopify plan included?", "No. You pay the plan directly to Shopify."],
    ]),
    {
      type: "Cta",
      props: { id: "cta", title: "Shall we start your store?", text: "", buttonLabel: "Write to me", buttonHref: "/contacto", background: "ink" },
    },
  ],
  solo: [hero("hero", "Sitios WordPress que se administran solos", "Solo en español.", "Cuéntame tu proyecto")],
  draft: [hero("hero", "Landing en borrador", "Todavía no se publica.", "Cuéntame tu proyecto")],
};

function page(content: Block[]): Prisma.InputJsonValue {
  const data = { root: { props: {} }, content };
  // A fixture that fails validation would make the public tests check a 404 by accident.
  const checked = validateBuilderData(data);
  if (!checked.success) throw new Error(`Invalid e2e landing fixture: ${checked.errors.join(" ")}`);
  return checked.data as unknown as Prisma.InputJsonValue;
}

type Fixture = {
  locale: Locale;
  slug: string;
  title: string;
  translationKey: string;
  published: boolean;
  blocks: Block[] | null;
};

const fixtures: Fixture[] = [
  { locale: "es", slug: "e2e-builder", title: "E2E Landing con bloques", translationKey: "e2e-builder", published: true, blocks: pages.es },
  { locale: "en", slug: "e2e-builder-en", title: "E2E Landing with blocks", translationKey: "e2e-builder", published: true, blocks: pages.en },
  { locale: "es", slug: "e2e-solo-espanol", title: "E2E Landing solo en español", translationKey: "e2e-landing-solo", published: true, blocks: pages.solo },
  { locale: "es", slug: "e2e-borrador", title: "E2E Landing borrador", translationKey: "e2e-landing-draft", published: false, blocks: pages.draft },
  // Created in the dashboard and never built: it cannot be published from the list.
  { locale: "es", slug: "e2e-sin-pagina", title: "E2E Landing sin página", translationKey: "e2e-landing-empty", published: false, blocks: null },
];

async function main() {
  if (!isLocalDatabase(process.env.DATABASE_URL)) {
    throw new Error("seed-e2e-landings only runs against the local docker database.");
  }

  // Any other "e2e-" landing (an older fixture, a leftover) is removed; the fixtures are reset
  // below, including any slug or title a test changed.
  const fixtureVersions = fixtures.map(({ translationKey, locale }) => ({ translationKey, locale }));
  await db.landing.deleteMany({
    where: {
      OR: [{ slug: { startsWith: "e2e-" } }, { translationKey: { in: fixtures.map((fixture) => fixture.translationKey) } }],
      NOT: { OR: fixtureVersions },
    },
  });

  for (const fixture of fixtures) {
    const fields = {
      slug: fixture.slug,
      title: fixture.title,
      seoTitle: null,
      seoDescription: null,
      status: fixture.published ? ("PUBLISHED" as const) : ("DRAFT" as const),
      publishedAt: fixture.published ? PUBLISHED_AT : null,
      blocks: fixture.blocks ? page(fixture.blocks) : Prisma.DbNull,
      draftBlocks: Prisma.DbNull,
    };
    // Free the slug first if another row of this locale took it (a renamed fixture, for example).
    await db.landing.deleteMany({ where: { locale: fixture.locale, slug: fixture.slug, NOT: { translationKey: fixture.translationKey } } });
    await db.landing.upsert({
      where: { translationKey_locale: { translationKey: fixture.translationKey, locale: fixture.locale } },
      update: fields,
      create: { ...fields, locale: fixture.locale, translationKey: fixture.translationKey },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
