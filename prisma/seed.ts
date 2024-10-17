import { PrismaClient } from "@prisma/client";
import { passwordHash } from "../src/libs/password";
import roles from "./samples/roles";
import users from "./samples/users";

const prisma = new PrismaClient();

async function upsertRoles() {
  console.log("🌱 Seeding roles...");

  for (const role of roles) {
    console.log(`🎭 Role: ${role.name}`);

    let parentRole;
    if (role.parent) {
      parentRole = await prisma.role.findUnique({
        where: { name: role.parent },
      });

      if (!parentRole) {
        parentRole = await prisma.role.create({
          data: { name: role.parent },
        });
      }
    }

    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        parentId: parentRole ? parentRole.id : null,
      },
      create: {
        name: role.name,
        parentId: parentRole ? parentRole.id : null,
      },
    });
  }
}

async function upsertUsers() {
  console.log("🌱 Seeding users...");

  for (const user of users) {
    console.log(`👤 User: ${user.username}`);

    const role = await prisma.role.findUnique({
      where: {
        name: user.role,
      },
    });

    if (!role) {
      console.error(`Role not found for user: ${user.username}`);
      continue;
    }

    const hashedPassword = await passwordHash(user.password);
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        roleId: role.id,
      },
      create: {
        name: user.name,
        email: user.email,
        username: user.username,
        password: hashedPassword,
        roleId: role.id,
      },
    });
  }
}

async function main() {
  await prisma.$transaction(async (tx) => {
    await upsertRoles();
    await upsertUsers();
  });
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Seeding finished. Disconnecting...");
    await prisma.$disconnect();
    process.exit(0);
  });
