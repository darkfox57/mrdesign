// Blog fixtures for the e2e tests, in Spanish and English: a published post and its translation, a
// draft and its translation, a published post with no translation, and a category. Idempotent, and
// refuses to run against anything but the local docker database.
import "dotenv/config";
import { db } from "@/lib/db";
import { isLocalDatabase } from "@/lib/is-local-database";

// Stored unsanitized on purpose: the post page must sanitize again when it renders.
const content =
  "<h2>Qué cambia</h2><p>Un sitio rápido convierte más visitas en clientes.</p>" +
  "<ul><li>Carga en menos de dos segundos</li><li>Se administra sin tocar código</li></ul>" +
  '<p data-e2e-unsafe onclick="window.__xss=1">Texto con atributo inseguro<script>window.__xss=1</script></p>';

const PUBLISHED_AT = new Date("2026-01-15T12:00:00Z");

type Locale = "es" | "en";

async function main() {
  if (!isLocalDatabase(process.env.DATABASE_URL)) {
    throw new Error("seed-e2e-blog only runs against the local docker database.");
  }

  const category = (locale: Locale, name: string, slug: string) =>
    db.category.upsert({
      where: { locale_slug: { locale, slug } },
      update: { name, translationKey: "e2e-blog-category" },
      create: { locale, name, slug, translationKey: "e2e-blog-category" },
    });
  const categories = {
    es: await category("es", "E2E Desarrollo", "e2e-desarrollo"),
    en: await category("en", "E2E Development", "e2e-development"),
  };

  const post = (data: { locale: Locale; slug: string; title: string; translationKey: string; published: boolean; body?: string }) => {
    const fields = {
      locale: data.locale,
      slug: data.slug,
      title: data.title,
      excerpt: `${data.title}: resumen de prueba.`,
      content: data.body ?? content,
      status: data.published ? ("PUBLISHED" as const) : ("DRAFT" as const),
      publishedAt: data.published ? PUBLISHED_AT : null,
      translationKey: data.translationKey,
      seoTitle: null,
      seoDescription: null,
      coverImageUrl: null,
      coverImageAlt: null,
    };
    const categoryId = categories[data.locale].id;
    return db.post.upsert({
      where: { locale_slug: { locale: data.locale, slug: data.slug } },
      update: { ...fields, categories: { set: [{ id: categoryId }] } },
      create: { ...fields, categories: { connect: [{ id: categoryId }] } },
    });
  };

  const fixtures = [
    { locale: "es", slug: "e2e-post-publicado", title: "E2E Post publicado", translationKey: "e2e-blog-post", published: true },
    { locale: "en", slug: "e2e-published-post", title: "E2E Published post", translationKey: "e2e-blog-post", published: true },
    { locale: "es", slug: "e2e-post-borrador", title: "E2E Post borrador", translationKey: "e2e-blog-draft", published: false },
    { locale: "en", slug: "e2e-draft-post", title: "E2E Draft post", translationKey: "e2e-blog-draft", published: false },
    { locale: "es", slug: "e2e-solo-espanol", title: "E2E Solo en español", translationKey: "e2e-blog-spanish-only", published: true },
    // Published and unpublished by the dashboard e2e (e2e/admin-posts.spec.ts); reset to draft on every run.
    { locale: "es", slug: "e2e-admin-publicable", title: "E2E Admin publicable", translationKey: "e2e-blog-admin-publishable", published: false },
  ] as const;

  // Posts the dashboard and ingest tests create get a fresh e2e- slug every run; remove them so they
  // do not pile up and push the fixtures off the first blog page. The fixtures are upserted again.
  const fixtureSlugs = [...fixtures.map((fixture) => fixture.slug), "e2e-post-con-tabla"];
  await db.post.deleteMany({ where: { slug: { startsWith: "e2e-", notIn: fixtureSlugs } } });
  // Categories and tags the ingest API tests create.
  await db.category.deleteMany({ where: { slug: { startsWith: "e2e-api-" } } });
  await db.tag.deleteMany({ where: { slug: { startsWith: "e2e-api-" } } });

  for (const fixture of fixtures) await post(fixture);

  // A draft with a table and an h4: the dashboard editor e2e (e2e/admin-post-editor.spec.ts) saves it
  // and checks nothing is lost. Reset on every run.
  await post({
    locale: "es",
    slug: "e2e-post-con-tabla",
    title: "E2E Post con tabla",
    translationKey: "e2e-blog-table",
    published: false,
    body:
      "<h4>Comparativa</h4><table><thead><tr><th>Plataforma</th><th>Entrega</th></tr></thead>" +
      "<tbody><tr><td>Shopify</td><td>Dos semanas</td></tr></tbody></table>" +
      '<p>Escríbeme en <a href="https://mrdesign.agency/contacto">contacto</a>.</p>',
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
