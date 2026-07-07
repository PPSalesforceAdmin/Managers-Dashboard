import { TableauClient } from "../src/lib/tableau/client";
import { groupViewsByProjectAndWorkbook } from "../src/lib/tableau/catalog";

async function main(): Promise<void> {
  const filter = process.argv.slice(2).join(" ").trim().toLowerCase();

  const client = TableauClient.fromEnv();
  await client.signIn();
  try {
    const views = await client.listViews();

    const filtered = filter
      ? views.filter((v) => {
          const haystack = [v.name, v.workbookName, v.projectName]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(filter);
        })
      : views;

    if (filter) {
      console.log(
        `Filter: "${filter}" — ${filtered.length} of ${views.length} view(s)\n`,
      );
    } else {
      console.log(`Found ${filtered.length} view(s):\n`);
    }

    // Group by project, then workbook, for readability
    const groups = groupViewsByProjectAndWorkbook(filtered);
    for (const { project, workbooks } of groups) {
      console.log(`\n📁 ${project}`);
      for (const { workbook, views } of workbooks) {
        console.log(`  📘 ${workbook}`);
        for (const v of views) {
          console.log(`    • ${v.name}`);
          console.log(`        LUID:       ${v.id}`);
          console.log(`        contentUrl: ${v.contentUrl}`);
        }
      }
    }
    console.log("");
  } finally {
    await client.signOut();
  }
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
