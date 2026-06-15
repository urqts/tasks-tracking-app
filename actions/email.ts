"use server";

import { startOfDay, endOfDay, addDays, format } from "date-fns";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/services/email";
import { dueReminderEmail } from "@/emails/templates";
import type { ActionResult } from "@/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Sends the signed-in user a sample reminder email immediately, so they can
 * verify their email setup without waiting for the daily cron job.
 *
 * Uses their real upcoming/overdue tasks when available; otherwise falls back
 * to a representative example so the email is never empty.
 */
export async function sendTestEmail(): Promise<
  ActionResult<{ delivered: boolean; configured: boolean }>
> {
  const user = await requireUser();

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrowEnd = endOfDay(addDays(now, 1));

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      deletedAt: null,
      status: { notIn: ["COMPLETED", "ARCHIVED"] },
      dueDate: { not: null, lte: tomorrowEnd },
    },
    select: { id: true, title: true, dueDate: true },
    orderBy: { dueDate: "asc" },
    take: 15,
  });

  type Row = { title: string; dueDate: string; link: string };
  const overdue: Row[] = [];
  const dueToday: Row[] = [];
  const dueTomorrow: Row[] = [];

  for (const t of tasks) {
    const due = t.dueDate as Date;
    const row: Row = {
      title: t.title,
      dueDate: format(due, "MMM d"),
      link: `${APP_URL}/tasks?focus=${t.id}`,
    };
    if (due < todayStart) overdue.push(row);
    else if (due <= todayEnd) dueToday.push(row);
    else dueTomorrow.push(row);
  }

  // Fallback sample so the test email always shows content.
  if (overdue.length + dueToday.length + dueTomorrow.length === 0) {
    dueToday.push({
      title: "This is a sample task — your real reminders will look like this",
      dueDate: format(now, "MMM d"),
      link: `${APP_URL}/tasks`,
    });
  }

  const { subject, html } = dueReminderEmail({ name: user.name, overdue, dueToday, dueTomorrow });
  const res = await sendEmail({ to: user.email, subject, html });

  if (res.skipped) {
    return {
      success: false,
      error:
        "Email isn't configured yet. Add RESEND_API_KEY and EMAIL_FROM to your environment variables, then redeploy.",
    };
  }
  if (!res.ok) {
    return {
      success: false,
      error: res.error ?? "Couldn't send the email. Check your Resend API key and sender address.",
    };
  }

  return { success: true, data: { delivered: true, configured: true } };
}
