import { TableauClient } from "../src/lib/tableau/client";

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
    const byProject = new Map<string, Map<string, typeof filtered>>();
    for (const v of filtered) {
      const project = v.projectName ?? "(no project)";
      const workbook = v.workbookName ?? "(no workbook)";
      if (!byProject.has(project)) byProject.set(project, new Map());
      const wb = byProject.get(project)!;
      if (!wb.has(workbook)) wb.set(workbook, []);
      wb.get(workbook)!.push(v);
    }

    const projectNames = [...byProject.keys()].sort();
    for (const project of projectNames) {
      console.log(`\n📁 ${project}`);
      const wbMap = byProject.get(project)!;
      const workbookNames = [...wbMap.keys()].sort();
      for (const wb of workbookNames) {
        console.log(`  📘 ${wb}`);
        for (const v of wbMap.get(wb)!) {
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
