"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recurringTaskSchema } from "@/lib/validations/task";
import { computeNextOccurrence } from "@/services/recurrence";
import type { ActionResult } from "@/types";

export async function getRecurringTasks() {
  const userId = await requireUserId();
  return prisma.recurringTask.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function createRecurringTask(input: unknown): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = recurringTaskSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const nextRunAt = d.startDate;

  const rec = await prisma.recurringTask.create({
    data: {
      userId,
      title: d.title,
      frequency: d.frequency,
      interval: d.interval,
      byWeekday: d.byWeekday ?? null,
      byMonthDay: d.byMonthDay ?? null,
      startDate: d.startDate,
      endDate: d.endDate,
      nextRunAt,
      priority: d.priority,
      estimatedMinutes: d.estimatedMinutes ?? null,
      categoryId: d.categoryId ?? null,
      projectId: d.projectId ?? null,
    },
  });

  revalidatePath("/tasks");
  return { success: true, data: { id: rec.id } };
}

export async function deleteRecurringTask(id: string): Promise<ActionResult<null>> {
  const userId = await requireUserId();
  const res = await prisma.recurringTask.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date(), active: false },
  });
  if (res.count === 0) return { success: false, error: "Not found" };
  revalidatePath("/tasks");
  return { success: true, data: null };
}

/**
 * Materializes concrete Task rows for any recurring rule whose nextRunAt is due.
 * Called by the cron endpoint. Safe to run repeatedly (idempotent per occurrence).
 */
export async function generateDueRecurringTasks(userId?: string): Promise<number> {
  const now = new Date();
  const rules = await prisma.recurringTask.findMany({
    where: {
      deletedAt: null,
      active: true,
      nextRunAt: { lte: now },
      ...(userId ? { userId } : {}),
    },
  });

  let created = 0;
  for (const rule of rules) {
    // Generate any missed occurrences up to now, capped to avoid runaways.
    let occurrence = rule.nextRunAt ?? rule.startDate;
    let guard = 0;
    while (occurrence && occurrence <= now && guard < 60) {
      if (rule.endDate && occurrence > rule.endDate) break;

      await prisma.task.create({
        data: {
          userId: rule.userId,
          title: rule.title,
          priority: rule.priority,
          status: rule.defaultStatus,
          dueDate: occurrence,
          estimatedMinutes: rule.estimatedMinutes,
          categoryId: rule.categoryId,
          projectId: rule.projectId,
          recurringTaskId: rule.id,
        },
      });
      created++;

      occurrence = computeNextOccurrence(
        occurrence,
        rule.frequency,
        rule.interval,
        rule.byWeekday,
        rule.byMonthDay,
      );
      guard++;
    }

    await prisma.recurringTask.update({
      where: { id: rule.id },
      data: {
        lastRunAt: now,
        nextRunAt: occurrence,
        active: rule.endDate && occurrence && occurrence > rule.endDate ? false : true,
      },
    });
  }

  return created;
}
