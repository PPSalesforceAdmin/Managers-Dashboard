import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: { name: "Admin", description: "Full administrative access" },
  });

  await prisma.role.upsert({
    where: { name: "Viewer" },
    update: {},
    create: { name: "Viewer", description: "Read-only access to granted reports" },
  });

  await prisma.category.upsert({
    where: { name: "General" },
    update: {},
    create: { name: "General", description: "Default report category", sortOrder: 0 },
  });

  console.log("Seed complete: roles (Admin, Viewer) and category (General).");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
