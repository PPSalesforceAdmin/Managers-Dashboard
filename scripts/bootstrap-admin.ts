import readline from "node:readline";
import { Writable } from "node:stream";
import { prisma } from "../src/lib/db";

function prompt(question: string): Promise<string> {
  const mutableStdout = new Writable({
    write(chunk, encoding, cb) {
      process.stdout.write(chunk, encoding);
      cb();
    },
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true,
  });

  return new Promise((resolve) => {
    process.stdout.write(question);
    rl.question("", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main(): Promise<void> {
  const existingAdmin = await prisma.user.findFirst({
    where: { isAdmin: true, status: "ACTIVE" },
  });
  if (existingAdmin) {
    console.log(
      "Admin account already exists. Use the app to create additional admins.",
    );
    process.exit(0);
  }

  const email = (await prompt("Admin email (@progressiveproperty.co.uk): ")).toLowerCase();
  if (!email || !email.includes("@")) {
    console.error("Invalid email.");
    process.exit(1);
  }

  const name = (await prompt("Full name (optional): ")).trim() || null;

  const existing = await prisma.user.findUnique({ where: { email } });
  const user = existing
    ? await prisma.user.update({
        where: { email },
        data: { isAdmin: true, status: "ACTIVE" },
      })
    : await prisma.user.create({
        data: { email, name, isAdmin: true, status: "ACTIVE" },
      });

  const adminRole = await prisma.role.findUnique({ where: { name: "Admin" } });
  if (adminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
      create: { userId: user.id, roleId: adminRole.id },
      update: {},
    });
  }

  console.log(
    `\nGranted admin to: ${user.email}. They can now sign in with Google.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
