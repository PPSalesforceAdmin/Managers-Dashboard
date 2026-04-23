import readline from "node:readline";
import { Writable } from "node:stream";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

function prompt(question: string, { silent = false } = {}): Promise<string> {
  const mutableStdout = new Writable({
    write(chunk, encoding, cb) {
      if (!silent) process.stdout.write(chunk, encoding);
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
      if (silent) process.stdout.write("\n");
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

  const email = (await prompt("Admin email: ")).toLowerCase();
  if (!email || !email.includes("@")) {
    console.error("Invalid email.");
    process.exit(1);
  }

  const name = (await prompt("Full name (optional): ")).trim() || null;

  const password = await prompt("Password (min 12 chars): ", { silent: true });
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }
  const confirm = await prompt("Confirm password: ", { silent: true });
  if (password !== confirm) {
    console.error("Passwords do not match.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      isAdmin: true,
      status: "ACTIVE",
      mfaEnabled: false,
      forcePasswordChange: false,
    },
  });

  const adminRole = await prisma.role.findUnique({ where: { name: "Admin" } });
  if (adminRole) {
    await prisma.userRole.create({
      data: { userId: user.id, roleId: adminRole.id },
    });
  }

  console.log(`\nCreated admin: ${user.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
