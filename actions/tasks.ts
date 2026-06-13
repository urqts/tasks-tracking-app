"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taskSchema, updateTaskSchema } from "@/lib/validations/task";
import type { ActionResult, TaskFilters } from "@/types";
import { logActivity } from "@/services/activity";

const REVALIDATE = ["/dashboard", "/tasks", "/board", "/calendar", "/analytics"];
function revalidateAll() {
  REVALIDATE.forEach((p) => revalidatePath(p));
}

const taskInclude = {
  project: true,
  category: true,
  subtasks: { where: { deletedAt: null }, orderBy: { position: "asc" } },
  taskTags: { include: { tag: true } },
  attachments: { where: { deletedAt: null } },
  _count: { select: { subtasks: true, attachments: true } },
} satisfies Prisma.TaskInclude;

/** Build a Prisma where-clause from URL/UI filters, always scoped to the user. */
function buildWhere(userId: string, filters: TaskFilters): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = { userId, deletedAt: null };
  if (filters.status?.length) where.status = { in: filters.status };
  if (filters.priority?.length) where.priority = { in: filters.priority };
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.tagId) where.taskTags = { some: { tagId: filters.tagId } };
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.dueBefore || filters.dueAfter) {
    where.dueDate = {};
    if (filters.dueAfter) (where.dueDate as Prisma.DateTimeFilter).gte = new Date(filters.dueAfter);
    if (filters.dueBefore) (where.dueDate as Prisma.DateTimeFilter).lte = new Date(filters.dueBefore);
  }
  return where;
}

export async function getTasks(filters: TaskFilters = {}, page = 1, pageSize = 50) {
  const userId = await requireUserId();
  const where = buildWhere(userId, filters);

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: [{ status: "asc" }, { position: "asc" }, { dueDate: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.task.count({ where }),
  ]);

  return { items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
}

export async function getTaskById(id: string) {
  const userId = await requireUserId();
  return prisma.task.findFirst({ where: { id, userId, deletedAt: null }, include: taskInclude });
}

export async function createTask(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { tagIds, ...data } = parsed.data;

  // Place the new task at the end of its status column.
  const last = await prisma.task.findFirst({
    where: { userId, status: data.status, deletedAt: null },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      ...data,
      userId,
      position: (last?.position ?? 0) + 1,
      completedAt: data.status === "COMPLETED" ? new Date() : null,
      taskTags: tagIds?.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
  });

  await logActivity(userId, "CREATED", "task", task.id, { title: task.title });
  revalidateAll();
  return { success: true, data: { id: task.id } };
}

export async function updateTask(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { id, tagIds, ...data } = parsed.data;

  const existing = await prisma.task.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) return { success: false, error: "Task not found" };

  // Manage completedAt when status changes.
  let completedAt = existing.completedAt;
  if (data.status && data.status !== existing.status) {
    completedAt = data.status === "COMPLETED" ? new Date() : null;
  }

  await prisma.task.update({
    where: { id },
    data: {
      ...data,
      completedAt,
      ...(tagIds
        ? { taskTags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) } }
        : {}),
    },
  });

  await logActivity(userId, data.status ? "STATUS_CHANGED" : "UPDATED", "task", id, {});
  revalidateAll();
  return { success: true, data: { id } };
}

/** Lightweight status change used by the Kanban board (with reordering). */
export async function moveTask(
  id: string,
  status: Prisma.TaskUpdateInput["status"],
  position: number,
): Promise<ActionResult<null>> {
  const userId = await requireUserId();
  const existing = await prisma.task.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) return { success: false, error: "Task not found" };

  const newStatus = status as "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ARCHIVED";
  await prisma.task.update({
    where: { id },
    data: {
      status: newStatus,
      position,
      completedAt:
        newStatus === "COMPLETED" ? existing.completedAt ?? new Date() : newStatus === existing.status ? existing.completedAt : null,
    },
  });
  revalidateAll();
  return { success: true, data: null };
}

export async function toggleTaskComplete(id: string): Promise<ActionResult<null>> {
  const userId = await requireUserId();
  const task = await prisma.task.findFirst({ where: { id, userId, deletedAt: null } });
  if (!task) return { success: false, error: "Task not found" };

  const completed = task.status === "COMPLETED";
  await prisma.task.update({
    where: { id },
    data: {
      status: completed ? "TODO" : "COMPLETED",
      completedAt: completed ? null : new Date(),
    },
  });
  await logActivity(userId, completed ? "UPDATED" : "COMPLETED", "task", id, {});
  revalidateAll();
  return { success: true, data: null };
}

/** Soft delete. */
export async function deleteTask(id: string): Promise<ActionResult<null>> {
  const userId = await requireUserId();
  const res = await prisma.task.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (res.count === 0) return { success: false, error: "Task not found" };
  await logActivity(userId, "DELETED", "task", id, {});
  revalidateAll();
  return { success: true, data: null };
}

// ---- Bulk actions -------------------------------------------------------

export async function bulkUpdateStatus(ids: string[], status: string): Promise<ActionResult<null>> {
  const userId = await requireUserId();
  await prisma.task.updateMany({
    where: { id: { in: ids }, userId, deletedAt: null },
    data: {
      status: status as "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ARCHIVED",
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });
  revalidateAll();
  return { success: true, data: null };
}

export async function bulkDelete(ids: string[]): Promise<ActionResult<null>> {
  const userId = await requireUserId();
  await prisma.task.updateMany({
    where: { id: { in: ids }, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  revalidateAll();
  return { success: true, data: null };
}
