import { Readable } from "node:stream";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const CUID_RE = /^c[a-z0-9]{24,}$/;
const SAFE_FILENAME_RE = /^[a-z0-9][a-z0-9._-]*$/i;

function assertValidReportId(reportId: string): void {
  if (!CUID_RE.test(reportId)) {
    throw new Error(`Invalid reportId: ${reportId}`);
  }
}

function assertSafeFilename(filename: string): void {
  if (!SAFE_FILENAME_RE.test(filename) || filename.includes("..")) {
    throw new Error(`Invalid filename: ${filename}`);
  }
}

export function objectKey(reportId: string, filename: string): string {
  assertValidReportId(reportId);
  assertSafeFilename(filename);
  return `${reportId}/${filename}`;
}

let clientSingleton: S3Client | null = null;

function getClient(): S3Client {
  if (clientSingleton) return clientSingleton;
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3 storage not configured: set S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY.",
    );
  }
  clientSingleton = new S3Client({
    endpoint,
    region: process.env.S3_REGION ?? "auto",
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
  return clientSingleton;
}

function getBucket(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET not set");
  return bucket;
}

function contentTypeFor(filename: string): string {
  if (filename.endsWith(".pdf")) return "application/pdf";
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

export async function writeReportFile(
  reportId: string,
  filename: string,
  buffer: Buffer,
): Promise<string> {
  const key = objectKey(reportId, filename);
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: buffer,
      ContentType: contentTypeFor(filename),
    }),
  );
  return key;
}

export async function writeReportThumbnail(
  reportId: string,
  buffer: Buffer,
): Promise<string> {
  return writeReportFile(reportId, "latest-thumb.png", buffer);
}

export async function readReportFile(
  reportId: string,
  filename: string,
): Promise<Readable> {
  const key = objectKey(reportId, filename);
  const res = await getClient().send(
    new GetObjectCommand({ Bucket: getBucket(), Key: key }),
  );
  if (!res.Body) {
    throw new Error(`Object ${key} returned no body`);
  }
  return res.Body as Readable;
}

export async function reportFileExists(
  reportId: string,
  filename: string,
): Promise<boolean> {
  try {
    await getClient().send(
      new HeadObjectCommand({
        Bucket: getBucket(),
        Key: objectKey(reportId, filename),
      }),
    );
    return true;
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode;
    const name = (err as { name?: string }).name;
    if (status === 404 || name === "NotFound" || name === "NoSuchKey") return false;
    throw err;
  }
}
