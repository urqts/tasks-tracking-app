import { NextResponse } from "next/server";
import { startOfDay, endOfDay, addDays, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { generateDueRecurringTasks } from "@/actions/recurring";
import { sendEmail } from "@/services/email";
import { dueReminderEmail } from "@/emails/templates";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Scheduled job (configure in vercel.json). Runs two things:
 *   1. Materializes due recurring tasks for all users.
 *   2. Sends email digests of overdue / due-today / due-tomorrow tasks to users
 *      who have email notifications enabled.
 *
 * Secured with a bearer token (CRON_SECRET). Vercel Cron sends this header
 * automatically when configured; you can also call it manually for testing.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Recurring task generation
  const created = await generateDueRecurringTasks();

  // 2. Email reminders
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrowEnd = endOfDay(addDays(now, 1));

  const users = await prisma.user.findMany({
    where: { deletedAt: null, settings: { emailNotifications: true } },
    select: { id: true, email: true, name: true, settings: true },
  });

  let emailsSent = 0;
  for (const user of users) {
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        status: { notIn: ["COMPLETED", "ARCHIVED"] },
        dueDate: { not: null, lte: tomorrowEnd },
      },
      select: { id: true, title: true, dueDate: true },
    });
    if (tasks.length === 0) continue;

    const s = user.settings;
    type Row = { title: string; dueDate: string; link: string };
    const overdue: Row[] = [];
    const dueToday: Row[] = [];
    const dueTomorrow: Row[] = [];
    for (const t of tasks) {
      const due = t.dueDate as Date;
      const row = { title: t.title, dueDate: format(due, "MMM d"), link: `${APP_URL}/tasks?focus=${t.id}` };
      if (due < todayStart) { if (s?.notifyOverdue) overdue.push(row); }
      else if (due <= todayEnd) { if (s?.notifyDueToday) dueToday.push(row); }
      else if (s?.notifyDueTomorrow) dueTomorrow.push(row);
    }

    if (overdue.length + dueToday.length + dueTomorrow.length === 0) continue;

    const { subject, html } = dueReminderEmail({ name: user.name, overdue, dueToday, dueTomorrow });
    const res = await sendEmail({ to: user.email, subject, html });
    if (res.ok && !res.skipped) emailsSent++;
  }

  return NextResponse.json({ ok: true, recurringTasksCreated: created, emailsSent });
}
