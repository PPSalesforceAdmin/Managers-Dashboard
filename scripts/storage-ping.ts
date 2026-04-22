import {
  writeReportFile,
  readReportFile,
  reportFileExists,
} from "../src/lib/storage";

async function main(): Promise<void> {
  const reportId = "c" + "a".repeat(24);
  const filename = "latest.pdf";
  const body = Buffer.from("%PDF-1.4 smoke test\n%%EOF\n");

  const key = await writeReportFile(reportId, filename, body);
  console.log("PUT_OK", key);

  const exists = await reportFileExists(reportId, filename);
  console.log("HEAD_OK", exists);

  const stream = await readReportFile(reportId, filename);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  const got = Buffer.concat(chunks);
  console.log("GET_OK", got.byteLength, "bytes");

  if (!got.equals(body)) {
    throw new Error("round-trip mismatch");
  }
  console.log("ROUND_TRIP_OK");
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
