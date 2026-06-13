"use server";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildXlsx, buildCsv } from "@/services/export";
import type { TaskFilters, TaskWithRelations } from "@/types";
import type { Prisma } from "@prisma/client";

export type ExportScope = "all" | "filtered" | "completed";
export type ExportFormat = "xlsx" | "csv";

const include = {
  project: true,
  category: true,
  subtasks: true,
  taskTags: { include: { tag: true } },
  attachments: true,
} satisfies Prisma.TaskInclude;

/**
 * Returns a base64 (xlsx) or raw (csv) payload plus filename. The client turns
 * this into a downloadable Blob.
 */
export async function exportTasks(
  formatType: ExportFormat,
  scope: ExportScope = "all",
  filters: TaskFilters = {},
): Promise<{ filename: string; mimeType: string; base64?: string; csv?: string }> {
  const userId = await requireUserId();

  const where: Prisma.TaskWhereInput = { userId, deletedAt: null };
  if (scope === "completed") where.status = "COMPLETED";
  if (scope === "filtered") {
    if (filters.status?.length) where.status = { in: filters.status };
    if (filters.priority?.length) where.priority = { in: filters.priority };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.tagId) where.taskTags = { some: { tagId: filters.tagId } };
  }

  const tasks = (await prisma.task.findMany({
    where,
    include,
    orderBy: { createdAt: "desc" },
  })) as unknown as TaskWithRelations[];

  const stamp = new Date().toISOString().slice(0, 10);

  if (formatType === "csv") {
    return {
      filename: `taskflow-${scope}-${stamp}.csv`,
      mimeType: "text/csv;charset=utf-8",
      csv: buildCsv(tasks),
    };
  }

  return {
    filename: `taskflow-${scope}-${stamp}.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    base64: buildXlsx(tasks),
  };
}
