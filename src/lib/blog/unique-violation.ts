import { Prisma } from "@/generated/prisma/client";

type UniqueMeta = {
  modelName?: string;
  target?: string | string[];
  driverAdapterError?: { cause?: { constraint?: { index?: string; fields?: string[] } } };
};

// Whether `error` is a unique violation (P2002) on any index of any model. Callers map the indexes
// they know with violatesUnique and keep this as the fallback for the rest.
export function isUniqueViolation(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

// The same fields, in any order, each once.
const sameFields = (reported: string[], fields: string[]) =>
  reported.length === fields.length && new Set(fields).size === fields.length && fields.every((field) => reported.includes(field));

// Every order of `fields`: an index name lists them in the schema's order, which callers need not know.
const orders = (fields: string[]): string[][] =>
  fields.length <= 1 ? [fields] : fields.flatMap((field, index) => orders(fields.filter((_, other) => other !== index)).map((rest) => [field, ...rest]));

// Whether `error` is a unique violation (P2002) on `model`, and, with `fields`, on the unique index
// over exactly those fields, in any order. Prisma 7 with @prisma/adapter-pg reports no `meta.target`:
// the model is `meta.modelName` and the constraint comes from the driver, as Postgres's index name
// ("Post_translationKey_locale_key", Prisma's default `<Model>_<fields>_key`) or as field names.
// Both forms and the older `meta.target` are read. Checked against Prisma 7.10.
export function violatesUnique(error: unknown, model: string, fields?: string[]): boolean {
  if (!isUniqueViolation(error)) return false;
  const meta = (error.meta ?? {}) as UniqueMeta;
  if (meta.modelName !== model) return false;
  if (!fields) return true;
  const constraint = meta.driverAdapterError?.cause?.constraint;
  const reported = constraint?.fields ?? (Array.isArray(meta.target) ? meta.target : undefined);
  if (reported) return sameFields(reported, fields);
  const index = constraint?.index ?? meta.target;
  return new Set(fields).size === fields.length && orders(fields).some((order) => index === `${model}_${order.join("_")}_key`);
}
