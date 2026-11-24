import "server-only";
import { DeleteObjectCommand, HeadObjectCommand, NotFound, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { hexToBase64, publicMediaUrl } from "./rules";

// Short-lived: the browser uploads right after asking.
const UPLOAD_URL_SECONDS = 300;

export class R2NotConfiguredError extends Error {}

function readEnv() {
  return {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET,
    publicUrl: process.env.R2_PUBLIC_URL,
  };
}

// Lets the library page show the "not configured" state instead of failing on the first upload.
export function isR2Configured() {
  return Object.values(readEnv()).every(Boolean);
}

function config() {
  const { accountId, accessKeyId, secretAccessKey, bucket, publicUrl } = readEnv();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new R2NotConfiguredError("R2 is not configured: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET and R2_PUBLIC_URL.");
  }
  // R2_ENDPOINT only exists for the e2e tests, which point it at a local fake (e2e/fake-r2.mjs).
  const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;
  return { endpoint, accessKeyId, secretAccessKey, bucket, publicUrl };
}

let cached: { client: S3Client; bucket: string; publicUrl: string } | null = null;

// Built on first use, so pages that never touch media do not need the R2 variables.
function r2() {
  if (cached) return cached;
  const { endpoint, accessKeyId, secretAccessKey, bucket, publicUrl } = config();
  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
    // Only the checksum we set ourselves: the SDK's default CRC32 would break the presigned upload.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  cached = { client, bucket, publicUrl };
  return cached;
}

export function mediaPublicUrl(key: string) {
  return publicMediaUrl(r2().publicUrl, key);
}

// The signature covers the size, the type and the SHA-256 checksum. R2 rejects a body whose
// checksum differs, so the URL can only upload the exact file the server approved.
export async function presignUpload({ key, contentType, size, sha256 }: { key: string; contentType: string; size: number; sha256: string }) {
  const { client, bucket } = r2();
  const checksum = hexToBase64(sha256);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
    ChecksumSHA256: checksum,
  });
  const url = await getSignedUrl(client, command, {
    expiresIn: UPLOAD_URL_SECONDS,
    // The presigner skips content-type by default; signing it pins the type the server approved.
    signableHeaders: new Set(["content-type"]),
    unhoistableHeaders: new Set(["x-amz-checksum-sha256"]),
  });
  return { url, headers: { "content-type": contentType, "x-amz-checksum-sha256": checksum } };
}

export type StoredObject = { size: number; contentType: string | undefined; checksumSha256: string | undefined };

export async function headObject(key: string): Promise<StoredObject | null> {
  const { client, bucket } = r2();
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key, ChecksumMode: "ENABLED" }));
    return { size: head.ContentLength ?? 0, contentType: head.ContentType, checksumSha256: head.ChecksumSHA256 };
  } catch (error) {
    if (error instanceof NotFound || (error as { name?: string }).name === "NotFound") return null;
    throw error;
  }
}

export async function deleteObject(key: string) {
  const { client, bucket } = r2();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
