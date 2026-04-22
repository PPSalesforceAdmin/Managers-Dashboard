import { promises as fs, createReadStream } from "node:fs";
import { ReadStream } from "node:fs";
import path from "node:path";

const CUID_RE = /^c[a-z0-9]{24,}$/;

function storageRoot(): string {
  return process.env.STORAGE_PATH ?? "./data/reports";
}

function assertValidReportId(reportId: string): void {
  if (!CUID_RE.test(reportId)) {
    throw new Error(`Invalid reportId: ${reportId}`);
  }
}

function reportDir(reportId: string): string {
  assertValidReportId(reportId);
  return path.join(storageRoot(), reportId);
}

export async function ensureReportDir(reportId: string): Promise<string> {
  const dir = reportDir(reportId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function atomicWrite(filePath: string, data: Buffer): Promise<void> {
  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, filePath);
}

export async function writeReportFile(
  reportId: string,
  filename: string,
  buffer: Buffer,
): Promise<string> {
  const dir = await ensureReportDir(reportId);
  const full = path.join(dir, filename);
  await atomicWrite(full, buffer);
  return full;
}

export async function writeReportThumbnail(
  reportId: string,
  buffer: Buffer,
): Promise<string> {
  return writeReportFile(reportId, "latest-thumb.png", buffer);
}

export function readReportFile(reportId: string, filename: string): ReadStream {
  const full = path.join(reportDir(reportId), filename);
  return createReadStream(full);
}

export async function reportFileExists(
  reportId: string,
  filename: string,
): Promise<boolean> {
  try {
    await fs.access(path.join(reportDir(reportId), filename));
    return true;
  } catch {
    return false;
  }
}
