import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { canPublishLanding, parseLandingId } from "@/lib/admin/landing-create";
import { publicationChange } from "@/lib/admin/posts";
import { db } from "@/lib/db";
import { MediaMissingError, withLibraryImages } from "@/lib/media/references";
import { collectPageStrings, imageHostErrors } from "@/lib/visual-builder/images";
import { parsePageFields, type LandingPageColumns } from "@/lib/visual-builder/page-fields";
import { validateBuilderData, type BuilderPage } from "@/lib/visual-builder/validate";

// Writes of the visual editor and of the landings list. What the browser sends is not trusted:
// the id, the blocks, their images and the page fields are checked here, and the slug must stay
// unique per language.
//
// Optimistic concurrency: the editor loads the landing's updatedAt (its version) and sends it with
// every save, publish and discard. A write only applies while the row still has that version, so an
// editor working on a stale copy cannot overwrite what someone else saved meanwhile.

export const LANDING_GONE = "La landing ya no existe. Recarga la página.";
export const LANDING_CONFLICT = "Alguien más guardó esta landing mientras la editabas. Recarga la página para ver la versión actual.";
export const LANDING_SLUG_TAKEN = "Slug: otra landing de este idioma ya lo usa.";
const NO_PAGE = "Esta landing todavía no tiene página. Ármala y publícala desde el editor visual.";
const ARCHIVED = "Esta landing está archivada: no se publica ni se despublica desde la lista.";

export const landingImageMissing = (url: string) =>
  `La imagen o el enlace ${url} no está en la biblioteca (puede que la hayan borrado). Elige otra imagen o cambia el enlace.`;

export type EditorWrite = { ok: true; version: string } | { ok: false; errors: string[] };

const versionSchema = z.iso.datetime();

function parseVersion(raw: unknown): Date | null {
  const parsed = versionSchema.safeParse(raw);
  return parsed.success ? new Date(parsed.data) : null;
}

type Checked = { errors: string[] } | { page: BuilderPage; columns: LandingPageColumns; publishedAt: Date | null };

async function checkPage(id: string, data: unknown, imagePrefixes: readonly string[]): Promise<Checked> {
  const landing = await db.landing.findUnique({ where: { id }, select: { locale: true, publishedAt: true } });
  if (!landing) return { errors: [LANDING_GONE] };

  const page = validateBuilderData(data);
  if (!page.success) return { errors: page.errors };
  const fields = parsePageFields(page.data.root.props);
  const errors = [...imageHostErrors(page.data, imagePrefixes), ...(fields.success ? [] : fields.errors)];
  if (!fields.success || errors.length > 0) return { errors };

  const taken = await db.landing.findFirst({
    where: { locale: landing.locale, slug: fields.data.slug, NOT: { id } },
    select: { id: true },
  });
  if (taken) return { errors: [LANDING_SLUG_TAKEN] };
  return { page: page.data, columns: fields.data, publishedAt: landing.publishedAt };
}

// The conditional write: one UPDATE ... WHERE id AND updatedAt, atomic in the database, so of two
// writes with the same version only the first matches. The new version is always later than the
// one it replaces, even for two writes within the same millisecond.
// `images`: the library URLs the written page uses, in images or links. Their rows are locked in the same
// transaction as the write, so an image deleted meanwhile refuses the write instead of leaving the
// landing pointing at it (src/lib/media/references.ts).
async function writeIfUnchanged(
  id: string,
  version: Date,
  data: Prisma.LandingUpdateManyMutationInput,
  images: { urls: string[]; prefixes: readonly string[] } = { urls: [], prefixes: [] },
): Promise<EditorWrite> {
  let rows: { updatedAt: Date }[];
  try {
    rows = await withLibraryImages(images.urls, images.prefixes, (tx) =>
      tx.landing.updateManyAndReturn({
        where: { id, updatedAt: version },
        data: { ...data, updatedAt: nextVersion(version) },
        select: { updatedAt: true },
      }),
    );
  } catch (error) {
    if (error instanceof MediaMissingError) return { ok: false, errors: error.urls.map(landingImageMissing) };
    // Another save took the slug between the check and the write.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, errors: [LANDING_SLUG_TAKEN] };
    throw error;
  }
  if (rows.length === 0) {
    const exists = await db.landing.findUnique({ where: { id }, select: { id: true } });
    return { ok: false, errors: [exists ? LANDING_CONFLICT : LANDING_GONE] };
  }
  return { ok: true, version: rows[0].updatedAt.toISOString() };
}

type Target = { errors: string[] } | { id: string; version: Date };

async function target(rawId: unknown, rawVersion: unknown): Promise<Target> {
  const id = parseLandingId(rawId);
  if (!id) return { errors: [LANDING_GONE] };
  const version = parseVersion(rawVersion);
  if (version) return { id, version };
  const exists = await db.landing.findUnique({ where: { id }, select: { id: true } });
  return { errors: [exists ? LANDING_CONFLICT : LANDING_GONE] };
}

// Every library URL of the page, images and links alike.
const pageImages = (page: BuilderPage, prefixes: readonly string[]) => ({ urls: collectPageStrings(page), prefixes });

// Saves the draft only: nothing the public page uses changes. The page fields (title, slug, SEO)
// travel inside the draft (its root props) and reach the landing's columns only on publish, so a
// draft never moves a published landing's URL or changes its title before it is published.
export async function saveDraft(rawId: unknown, rawVersion: unknown, data: unknown, imagePrefixes: readonly string[]): Promise<EditorWrite> {
  const to = await target(rawId, rawVersion);
  if ("errors" in to) return { ok: false, errors: to.errors };
  const checked = await checkPage(to.id, data, imagePrefixes);
  if ("errors" in checked) return { ok: false, errors: checked.errors };
  return writeIfUnchanged(to.id, to.version, { draftBlocks: checked.page as Prisma.InputJsonValue }, pageImages(checked.page, imagePrefixes));
}

// Publishes what the editor has now: it becomes the page's blocks and the draft is cleared.
export async function publishPage(rawId: unknown, rawVersion: unknown, data: unknown, imagePrefixes: readonly string[]): Promise<EditorWrite> {
  const to = await target(rawId, rawVersion);
  if ("errors" in to) return { ok: false, errors: to.errors };
  const checked = await checkPage(to.id, data, imagePrefixes);
  if ("errors" in checked) return { ok: false, errors: checked.errors };
  return writeIfUnchanged(to.id, to.version, {
    ...checked.columns,
    blocks: checked.page as Prisma.InputJsonValue,
    draftBlocks: Prisma.DbNull,
    // Same rule as posts: a first publish stamps today's date, later ones keep it.
    ...publicationChange("publish", checked.publishedAt),
  }, pageImages(checked.page, imagePrefixes));
}

export async function discardDraft(rawId: unknown, rawVersion: unknown): Promise<EditorWrite> {
  const to = await target(rawId, rawVersion);
  if ("errors" in to) return { ok: false, errors: to.errors };
  return writeIfUnchanged(to.id, to.version, { draftBlocks: Prisma.DbNull });
}

// Every write moves the version strictly forward, even within the same millisecond or with a clock
// behind the stored value, so no write can hand an old version back to a stale editor.
export function nextVersion(version: Date) {
  return new Date(Math.max(Date.now(), version.getTime() + 1));
}

// Publish or unpublish from the landings list. It changes the status only, so the client sends no
// version; the write still moves the version forward, and an open editor sees a newer version.
export async function changePublication(id: string, intent: "publish" | "unpublish"): Promise<{ error?: string }> {
  const landing = await db.landing.findUnique({
    where: { id },
    select: { status: true, publishedAt: true, blocks: true, updatedAt: true },
  });
  if (!landing) return { error: LANDING_GONE };
  // The list shows no publish button for an archived landing; a replayed request gets the same answer.
  if (landing.status === "ARCHIVED") return { error: ARCHIVED };
  if (intent === "publish" && !canPublishLanding(landing)) return { error: NO_PAGE };
  // Conditional on the version read above: no match means the row is gone, or another write
  // changed it in between (then the visitor reloads and decides again).
  const { count } = await db.landing.updateMany({
    where: { id, updatedAt: landing.updatedAt },
    data: { ...publicationChange(intent, landing.publishedAt), updatedAt: nextVersion(landing.updatedAt) },
  });
  if (count > 0) return {};
  return (await db.landing.count({ where: { id } })) === 0 ? { error: LANDING_GONE } : { error: LANDING_CONFLICT };
}
