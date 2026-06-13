/**
 * Reusable, dependency-free HTML email templates. Each returns a subject and
 * an HTML body so the sender (services/email.ts) stays format-agnostic.
 */

interface ReminderTask {
  title: string;
  dueDate?: string | null;
  link: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function layout(title: string, inner: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <div style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
        <div style="background:#6366f1;padding:20px 24px;color:#ffffff;font-size:18px;font-weight:600;">TaskFlow</div>
        <div style="padding:24px;">
          <h1 style="margin:0 0 12px;font-size:18px;">${title}</h1>
          ${inner}
        </div>
      </div>
      <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px;">
        You're receiving this because email reminders are enabled in your TaskFlow settings.
        <br/><a href="${APP_URL}/settings" style="color:#6366f1;">Manage preferences</a>
      </p>
    </div>
  </body>
</html>`;
}

function taskRows(tasks: ReminderTask[]): string {
  return tasks
    .map(
      (t) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
          <a href="${t.link}" style="color:#0f172a;text-decoration:none;font-weight:500;">${t.title}</a>
          ${t.dueDate ? `<div style="color:#64748b;font-size:13px;">Due ${t.dueDate}</div>` : ""}
        </td>
      </tr>`,
    )
    .join("");
}

export function dueReminderEmail(opts: {
  name?: string | null;
  overdue: ReminderTask[];
  dueToday: ReminderTask[];
  dueTomorrow: ReminderTask[];
}): { subject: string; html: string } {
  const greeting = opts.name ? `Hi ${opts.name},` : "Hi,";
  const sections: string[] = [`<p style="margin:0 0 16px;color:#475569;">${greeting} here's your task summary.</p>`];

  if (opts.overdue.length) {
    sections.push(`<h2 style="font-size:14px;color:#ef4444;margin:16px 0 4px;">Overdue (${opts.overdue.length})</h2><table style="width:100%;border-collapse:collapse;">${taskRows(opts.overdue)}</table>`);
  }
  if (opts.dueToday.length) {
    sections.push(`<h2 style="font-size:14px;color:#3b82f6;margin:16px 0 4px;">Due today (${opts.dueToday.length})</h2><table style="width:100%;border-collapse:collapse;">${taskRows(opts.dueToday)}</table>`);
  }
  if (opts.dueTomorrow.length) {
    sections.push(`<h2 style="font-size:14px;color:#8b5cf6;margin:16px 0 4px;">Due tomorrow (${opts.dueTomorrow.length})</h2><table style="width:100%;border-collapse:collapse;">${taskRows(opts.dueTomorrow)}</table>`);
  }

  sections.push(`<a href="${APP_URL}/dashboard" style="display:inline-block;margin-top:20px;background:#6366f1;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:500;">Open TaskFlow</a>`);

  const total = opts.overdue.length + opts.dueToday.length + opts.dueTomorrow.length;
  return {
    subject: `TaskFlow — ${total} task${total === 1 ? "" : "s"} need your attention`,
    html: layout("Your task reminders", sections.join("")),
  };
}
