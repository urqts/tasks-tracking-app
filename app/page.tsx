import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Kanban, Calendar, BarChart3, Repeat, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAuthUser } from "@/lib/auth";

const FEATURES = [
  { icon: CheckCircle2, title: "Tasks & subtasks", desc: "Priorities, statuses, due dates, time tracking and nested subtasks." },
  { icon: Kanban, title: "Kanban board", desc: "Drag tasks across To Do, In Progress, Review and Completed." },
  { icon: Calendar, title: "Calendar", desc: "Monthly, weekly and daily views with drag-to-reschedule." },
  { icon: Repeat, title: "Recurring tasks", desc: "Daily, weekly, monthly, yearly and custom intervals." },
  { icon: BarChart3, title: "Analytics", desc: "Completion trends, category and priority breakdowns." },
  { icon: Bell, title: "Reminders", desc: "Browser and email notifications for due and overdue work." },
];

export default async function LandingPage() {
  const user = await getAuthUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          TaskFlow
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="container flex-1">
        <section className="mx-auto max-w-3xl py-20 text-center md:py-28">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Your work, organized and{" "}
            <span className="text-primary">actually done.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            TaskFlow combines the best of Todoist, Notion, Trello and TickTick into
            one clean, fast workspace for personal tasks, homework, projects and goals.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">Create free account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Built with Next.js, Supabase &amp; Prisma.
      </footer>
    </div>
  );
}
