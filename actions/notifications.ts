"use server";

import { startOfDay, endOfDay, addDays } from "date-fns";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface DueNotification {
  id: string;
  title: string;
  type: "OVERDUE" | "DUE_TODAY" | "DUE_TOMORROW";
  dueDate: string;
}

/**
 * Returns tasks that are overdue, due today, or due tomorrow for the current
 * user — used by the browser-notification watcher and the in-app bell.
 */
export async function getDueNotifications(): Promise<DueNotification[]> {
  const userId = await requireUserId();
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrowEnd = endOfDay(addDays(now, 1));

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      deletedAt: null,
      status: { notIn: ["COMPLETED", "ARCHIVED"] },
      dueDate: { not: null, lte: tomorrowEnd },
    },
    select: { id: true, title: true, dueDate: true },
    orderBy: { dueDate: "asc" },
    take: 50,
  });

  return tasks
    .filter((t) => t.dueDate)
    .map((t) => {
      const due = t.dueDate as Date;
      let type: DueNotification["type"];
      if (due < todayStart) type = "OVERDUE";
      else if (due <= todayEnd) type = "DUE_TODAY";
      else type = "DUE_TOMORROW";
      return { id: t.id, title: t.title, type, dueDate: due.toISOString() };
    });
}

/** Mark a stored notification as read. */
export async function markNotificationRead(id: string) {
  const userId = await requireUserId();
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
  return { success: true as const };
}
