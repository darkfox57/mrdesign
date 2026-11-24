import { Prisma } from "@/generated/prisma/client";

type UniqueMeta = {
  modelName?: string;
  target?: string | string[];
  driverAdapterError?: { cause?: { constraint?: { index?: string; fields?: string[] } } };
};

// Whether `error` is a unique violation (P2002) on `model`, and, with `fields`, on the unique index
// over exactly those fields. Prisma 7 with @prisma/adapter-pg reports no `meta.target`: the model is
// `meta.modelName` and the constraint comes from the driver, as Postgres's index name
// ("Post_translationKey_locale_key", Prisma's default `<Model>_<fields>_key`) or as field names.
// Both forms and the older `meta.target` are read. Checked against Prisma 7.10.
export function violatesUnique(error: unknown, model: string, fields?: string[]): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  const meta = (error.meta ?? {}) as UniqueMeta;
  if (meta.modelName !== model) return false;
  if (!fields) return true;
  const constraint = meta.driverAdapterError?.cause?.constraint;
  const reported = constraint?.fields ?? (Array.isArray(meta.target) ? meta.target : undefined);
  if (reported) return reported.join(",") === fields.join(",");
  return (constraint?.index ?? meta.target) === `${model}_${fields.join("_")}_key`;
}
