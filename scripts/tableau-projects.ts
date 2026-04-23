import { TableauClient } from "../src/lib/tableau/client";

async function main(): Promise<void> {
  const client = TableauClient.fromEnv();
  await client.signIn();
  try {
    // Access private members via `any` for diag only
    const c = client as unknown as {
      baseUrl: () => string;
      token: string;
      siteLuid: string;
    };
    // Use a direct fetch to the projects endpoint
    const endpoint = `${c.baseUrl()}/sites/${(client as any).siteLuid}/projects?pageSize=1000`;
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "X-Tableau-Auth": (client as any).token,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      console.error(`projects fetch failed: ${res.status}`);
      console.error(await res.text());
      process.exit(1);
    }
    const data = await res.json();
    const items = Array.isArray(data.projects?.project)
      ? data.projects.project
      : data.projects?.project
      ? [data.projects.project]
      : [];
    console.log(`Found ${items.length} project(s):\n`);
    for (const p of items) {
      console.log(`  ${p.name}  (id: ${p.id})`);
    }
  } finally {
    await client.signOut();
  }
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
