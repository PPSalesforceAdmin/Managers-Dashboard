import { TableauClient } from "../src/lib/tableau/client";

async function main(): Promise<void> {
  const client = TableauClient.fromEnv();
  await client.signIn();
  console.log("SIGNIN_OK");
  await client.signOut();
  console.log("SIGNOUT_OK");
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
