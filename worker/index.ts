import { prisma } from "@/lib/db";
import { TableauClient } from "@/lib/tableau/client";
import { findDueReports } from "./dispatcher";
import { exportReport } from "./exporter";

async function main(): Promise<void> {
  const due = await findDueReports();

  if (due.length === 0) {
    console.log("no reports due");
    return;
  }

  console.log(`found ${due.length} due report(s)`);

  const client = TableauClient.fromEnv();
  await client.signIn();

  try {
    for (const report of due) {
      console.log(`exporting ${report.id} — ${report.name}`);
      try {
        await exportReport(report, client);
        console.log(`  ok`);
      } catch (err) {
        console.error(`  failed:`, err);
      }
    }
  } finally {
    await client.signOut();
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("worker tick failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
