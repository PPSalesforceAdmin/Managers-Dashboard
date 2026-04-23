import { TableauClient } from "../src/lib/tableau/client";

async function main(): Promise<void> {
  const viewLuid = process.argv[2];
  if (!viewLuid) {
    console.error("Usage: npm run tableau:export-test -- <viewLuid>");
    process.exit(1);
  }

  const client = TableauClient.fromEnv();
  await client.signIn();
  try {
    const pdf = await client.exportViewPdf(viewLuid, { orientation: "landscape" });
    console.log(`PDF_OK: ${pdf.byteLength} bytes`);
  } finally {
    await client.signOut();
  }
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
