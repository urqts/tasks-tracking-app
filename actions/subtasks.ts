"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subtaskSchema } from "@/lib/validations/task";
import type { ActionResult } from "@/types";

export async function addSubtask(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = subtaskSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };

  // Ensure the parent task belongs to the user.
  const task = await prisma.task.findFirst({ where: { id: parsed.data.taskId, userId, deletedAt: null } });
  if (!task) return { success: false, error: "Task not found" };

  const last = await prisma.subtask.findFirst({
    where: { taskId: task.id, deletedAt: null },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const subtask = await prisma.subtask.create({
    data: {
      title: parsed.data.title,
      taskId: task.id,
      parentId: parsed.data.parentId ?? null,
      userId,
      position: (last?.position ?? 0) + 1,
    },
  });

  revalidatePath("/tasks");
  return { success: true, data: { id: subtask.id } };
}

export async function toggleSubtask(id: string): Promise<ActionResult<null>> {
  const userId = await requireUserId();
  const subtask = await prisma.subtask.findFirst({ where: { id, userId, deletedAt: null } });
  if (!subtask) return { success: false, error: "Subtask not found" };

  await prisma.subtask.update({ where: { id }, data: { completed: !subtask.completed } });
  revalidatePath("/tasks");
  return { success: true, data: null };
}

export async function updateSubtask(id: string, title: string): Promise<ActionResult<null>> {
  const userId = await requireUserId();
  const res = await prisma.subtask.updateMany({ where: { id, userId, deletedAt: null }, data: { title } });
  if (res.count === 0) return { success: false, error: "Subtask not found" };
  revalidatePath("/tasks");
  return { success: true, data: null };
}

export async function deleteSubtask(id: string): Promise<ActionResult<null>> {
  const userId = await requireUserId();
  const res = await prisma.subtask.updateMany({ where: { id, userId, deletedAt: null }, data: { deletedAt: new Date() } });
  if (res.count === 0) return { success: false, error: "Subtask not found" };
  revalidatePath("/tasks");
  return { success: true, data: null };
}

/** Progress as a 0-100 percentage of completed subtasks. */
export function subtaskProgress(subtasks: { completed: boolean }[]): number {
  if (subtasks.length === 0) return 0;
  const done = subtasks.filter((s) => s.completed).length;
  return Math.round((done / subtasks.length) * 100);
}
