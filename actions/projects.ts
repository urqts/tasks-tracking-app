"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/validations/task";
import type { ActionResult, ProjectWithStats } from "@/types";

export async function getProjects(): Promise<ProjectWithStats[]> {
  const userId = await requireUserId();
  const projects = await prisma.project.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      tasks: { where: { deletedAt: null }, select: { status: true } },
    },
  });

  return projects.map((p) => {
    const taskCount = p.tasks.length;
    const completedCount = p.tasks.filter((t) => t.status === "COMPLETED").length;
    const progress = taskCount === 0 ? 0 : Math.round((completedCount / taskCount) * 100);
    const { tasks, ...rest } = p;
    return { ...rest, taskCount, completedCount, progress };
  });
}

export async function createProject(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };

  const project = await prisma.project.create({ data: { ...parsed.data, userId } });
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true, data: { id: project.id } };
}

export async function updateProject(id: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = projectSchema.partial().safeParse(input);
  if (!parsed.success) return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };

  const res = await prisma.project.updateMany({ where: { id, userId, deletedAt: null }, data: parsed.data });
  if (res.count === 0) return { success: false, error: "Project not found" };
  revalidatePath("/projects");
  return { success: true, data: { id } };
}

export async function deleteProject(id: string): Promise<ActionResult<null>> {
  const userId = await requireUserId();
  const res = await prisma.project.updateMany({ where: { id, userId, deletedAt: null }, data: { deletedAt: new Date() } });
  if (res.count === 0) return { success: false, error: "Project not found" };
  revalidatePath("/projects");
  return { success: true, data: null };
}
