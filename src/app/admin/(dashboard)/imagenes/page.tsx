import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { listMedia } from "@/lib/media/library";
import { isR2Configured } from "@/lib/media/r2";
import { AltTextForm, DeleteMediaForm } from "./MediaCardForms";
import { MediaUploader } from "./MediaUploader";

export const metadata: Metadata = { title: "Imágenes" };

const PAGE_SIZE = 30;
const pageSchema = z.coerce.number().int().min(1).catch(1);
const sizeFormat = new Intl.NumberFormat("es", { maximumFractionDigits: 1 });
const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${sizeFormat.format(bytes / 1024)} KB` : `${sizeFormat.format(bytes / 1024 / 1024)} MB`);

export default async function MediaLibraryPage({ searchParams }: PageProps<"/admin/imagenes">) {
  // The page checks the session itself: the layout's check does not stop it from rendering.
  const { role } = await requireSession();
  const raw = (await searchParams).page;
  const page = pageSchema.parse(Array.isArray(raw) ? raw[0] : raw);
  const { items, total, pages } = await listMedia({ page, pageSize: PAGE_SIZE });
  const configured = isR2Configured();

  return (
    <>
      <h1 className="text-headline text-ink">Imágenes</h1>
      <p className="mt-2 max-w-2xl text-graphite">
        Las imágenes se guardan en Cloudflare R2 y se usan en el blog y las landings. Cada imagen necesita un texto alternativo, y una
        imagen en uso no se puede eliminar.
      </p>

      <div className="mt-6">
        {configured ? (
          <MediaUploader />
        ) : (
          <div role="status" className="rounded-card border border-danger bg-surface p-5 text-sm">
            <p className="font-medium text-ink">El almacenamiento de imágenes no está configurado.</p>
            <p className="mt-1 text-graphite">
              Para subir y eliminar imágenes, define en el servidor R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET y
              R2_PUBLIC_URL, y reinicia la aplicación.
            </p>
          </div>
        )}
      </div>

      <p className="mt-6 text-sm text-graphite">{total === 1 ? "1 imagen" : `${total} imágenes`}</p>
      {items.length === 0 ? (
        <div className="mt-4 rounded-card border border-line bg-surface p-8 text-center text-graphite">
          {total > 0 ? (
            <p>
              Esta página no tiene imágenes.{" "}
              <Link href="/admin/imagenes" className="font-medium text-brand-600 underline underline-offset-2">
                Ir a la primera página
              </Link>
            </p>
          ) : (
            <p>Todavía no hay imágenes.{configured ? " Sube la primera desde el recuadro de arriba." : ""}</p>
          )}
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((media) => (
            <li key={media.id} className="grid content-start gap-3 rounded-card border border-line bg-surface p-4">
              {/* Plain img: thumbnails come from the R2 public domain and the admin is not indexed. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={media.url} alt={media.alt} loading="lazy" className="aspect-video w-full rounded-control bg-paper object-contain" />
              <div className="text-sm">
                <p className="font-medium break-all text-ink">{media.originalName}</p>
                <p className="text-graphite">{formatSize(media.size)}</p>
                {media.alt ? null : <p className="mt-1 font-medium text-danger">Falta el texto alternativo.</p>}
              </div>
              <AltTextForm mediaId={media.id} name={media.originalName} alt={media.alt} />
              {role === "admin" && configured ? <DeleteMediaForm mediaId={media.id} name={media.originalName} /> : null}
            </li>
          ))}
        </ul>
      )}

      {pages > 1 ? (
        <nav aria-label="Páginas" className="mt-4 flex items-center gap-3 text-sm">
          {page > 1 ? (
            <Link href={`/admin/imagenes?page=${page - 1}`} className="font-medium text-brand-600 underline underline-offset-2">
              Anterior
            </Link>
          ) : null}
          <span className="text-graphite">
            Página {page} de {pages}
          </span>
          {page < pages ? (
            <Link href={`/admin/imagenes?page=${page + 1}`} className="font-medium text-brand-600 underline underline-offset-2">
              Siguiente
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
