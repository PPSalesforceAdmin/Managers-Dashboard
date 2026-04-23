import { TableauClient } from "../src/lib/tableau/client";

async function main(): Promise<void> {
  const client = TableauClient.fromEnv();
  await client.signIn();
  try {
    const views = await client.listViews();
    console.log(`Found ${views.length} view(s):\n`);
    for (const v of views) {
      const workbook = v.workbookName ? ` — workbook: ${v.workbookName}` : "";
      console.log(`  ${v.name}${workbook}`);
      console.log(`    LUID:       ${v.id}`);
      console.log(`    contentUrl: ${v.contentUrl}\n`);
    }
  } finally {
    await client.signOut();
  }
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
