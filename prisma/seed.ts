/**
 * Optional seed script. Creates a couple of categories/tags/projects for an
 * existing user. Pass the user id (the Supabase auth id) via SEED_USER_ID.
 *
 *   SEED_USER_ID=<uuid> npm run db:seed
 *
 * Note: the User row must already exist (created on first login by the
 * auth callback / ensureUser helper).
 */
import { PrismaClient, Priority, TaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userId = process.env.SEED_USER_ID;
  if (!userId) {
    console.error("Set SEED_USER_ID to an existing user id before seeding.");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error(`No user found with id ${userId}. Log in once first.`);
    process.exit(1);
  }

  const categories = ["Homework", "University", "Personal", "Work", "Fitness", "Finance"];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { userId_name: { userId, name } },
      update: {},
      create: { userId, name },
    });
  }

  const personal = await prisma.category.findFirst({ where: { userId, name: "Personal" } });

  const project = await prisma.project.create({
    data: {
      userId,
      name: "Getting started with TaskFlow",
      description: "A sample project to explore the app.",
      color: "#6366f1",
    },
  });

  await prisma.task.createMany({
    data: [
      {
        userId,
        title: "Read the TaskFlow README",
        description: "Learn how the app is structured.",
        priority: Priority.MEDIUM,
        status: TaskStatus.TODO,
        projectId: project.id,
        categoryId: personal?.id,
        dueDate: new Date(Date.now() + 86400000),
      },
      {
        userId,
        title: "Create your first real task",
        priority: Priority.HIGH,
        status: TaskStatus.IN_PROGRESS,
        projectId: project.id,
      },
      {
        userId,
        title: "Try the Kanban board",
        priority: Priority.LOW,
        status: TaskStatus.REVIEW,
        projectId: project.id,
      },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
