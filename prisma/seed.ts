import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const password = await bcrypt.hash("password123", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: { email: "alice@example.com", name: "Alice Admin", passwordHash: password },
  });
  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: { email: "bob@example.com", name: "Bob Member", passwordHash: password },
  });

  const project = await prisma.project.create({
    data: {
      name: "Demo Project",
      description: "Sample project to play with.",
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: "ADMIN" },
          { userId: bob.id, role: "MEMBER" },
        ],
      },
    },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.task.createMany({
    data: [
      {
        projectId: project.id,
        title: "Set up CI",
        description: "GitHub Actions for typecheck + build",
        status: "TODO",
        priority: "HIGH",
        creatorId: alice.id,
        assigneeId: bob.id,
        dueDate: tomorrow,
        tags: ["devops"],
      },
      {
        projectId: project.id,
        title: "Write README",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        creatorId: alice.id,
        assigneeId: alice.id,
        tags: ["docs"],
      },
      {
        projectId: project.id,
        title: "Fix overdue example task",
        status: "TODO",
        priority: "HIGH",
        creatorId: alice.id,
        assigneeId: bob.id,
        dueDate: yesterday,
        tags: ["bug"],
      },
    ],
  });

  console.log("Seeded demo users (alice@example.com / bob@example.com — password: password123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
