import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  eachDayOfInterval,
  format,
} from "date-fns";
import { prisma } from "@/lib/prisma";
import type { DashboardStats } from "@/types";
import type { Priority, TaskStatus } from "@prisma/client";

/** Aggregate the headline numbers shown on the dashboard. */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const base = { userId, deletedAt: null };
  const active = { ...base, status: { notIn: ["COMPLETED", "ARCHIVED"] as TaskStatus[] } };

  const [
    todayCount,
    upcomingCount,
    overdueCount,
    completedTodayCount,
    weeklyCompleted,
    weeklyTotal,
    monthlyCompleted,
    monthlyTotal,
    byPriority,
    byStatus,
  ] = await Promise.all([
    prisma.task.count({ where: { ...active, dueDate: { gte: todayStart, lte: todayEnd } } }),
    prisma.task.count({ where: { ...active, dueDate: { gt: todayEnd } } }),
    prisma.task.count({ where: { ...active, dueDate: { lt: todayStart } } }),
    prisma.task.count({ where: { ...base, status: "COMPLETED", completedAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.task.count({ where: { ...base, status: "COMPLETED", completedAt: { gte: weekStart, lte: weekEnd } } }),
    prisma.task.count({ where: { ...base, OR: [{ createdAt: { gte: weekStart, lte: weekEnd } }, { completedAt: { gte: weekStart, lte: weekEnd } }] } }),
    prisma.task.count({ where: { ...base, status: "COMPLETED", completedAt: { gte: monthStart, lte: monthEnd } } }),
    prisma.task.count({ where: { ...base, OR: [{ createdAt: { gte: monthStart, lte: monthEnd } }, { completedAt: { gte: monthStart, lte: monthEnd } }] } }),
    prisma.task.groupBy({ by: ["priority"], where: active, _count: true, orderBy: { priority: "asc" } }),
    prisma.task.groupBy({ by: ["status"], where: base, _count: true, orderBy: { status: "asc" } }),
  ]);

  const priorityBreakdown = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 } as Record<Priority, number>;
  byPriority.forEach((p) => (priorityBreakdown[p.priority] = p._count));

  const statusBreakdown = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, COMPLETED: 0, ARCHIVED: 0 } as Record<TaskStatus, number>;
  byStatus.forEach((s) => (statusBreakdown[s.status] = s._count));

  // Productivity score: weighted completion vs. outstanding/overdue work, 0-100.
  const outstanding = todayCount + upcomingCount + overdueCount;
  const denom = completedTodayCount + outstanding + overdueCount;
  const productivityScore = denom === 0 ? 100 : Math.round(((completedTodayCount + (outstanding - overdueCount) * 0.3) / denom) * 100);

  return {
    todayCount,
    upcomingCount,
    overdueCount,
    completedTodayCount,
    productivityScore: Math.max(0, Math.min(100, productivityScore)),
    weeklyCompleted,
    weeklyTotal,
    monthlyCompleted,
    monthlyTotal,
    priorityBreakdown,
    statusBreakdown,
  };
}

/** Daily completion counts for the last `days` days (for the trend charts). */
export async function getCompletionTrend(userId: string, days = 30) {
  const now = new Date();
  const start = startOfDay(subDays(now, days - 1));

  const tasks = await prisma.task.findMany({
    where: { userId, deletedAt: null, status: "COMPLETED", completedAt: { gte: start } },
    select: { completedAt: true },
  });

  const buckets = new Map<string, number>();
  eachDayOfInterval({ start, end: now }).forEach((d) => buckets.set(format(d, "yyyy-MM-dd"), 0));
  tasks.forEach((t) => {
    if (!t.completedAt) return;
    const key = format(t.completedAt, "yyyy-MM-dd");
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });

  return Array.from(buckets.entries()).map(([date, count]) => ({
    date: format(new Date(date), "MMM d"),
    count,
  }));
}

/** Category distribution for active tasks. */
export async function getCategoryDistribution(userId: string) {
  const rows = await prisma.task.groupBy({
    by: ["categoryId"],
    where: { userId, deletedAt: null },
    _count: true,
    orderBy: { categoryId: "asc" },
  });
  const categories = await prisma.category.findMany({ where: { userId, deletedAt: null } });
  const map = new Map(categories.map((c) => [c.id, c]));

  return rows.map((r) => {
    const cat = r.categoryId ? map.get(r.categoryId) : null;
    return { name: cat?.name ?? "Uncategorized", value: r._count, color: cat?.color ?? "#94a3b8" };
  });
}
