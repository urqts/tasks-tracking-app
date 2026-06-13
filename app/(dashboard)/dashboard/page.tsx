import Link from "next/link";
import { format, isPast, isToday } from "date-fns";
import {
  CalendarClock,
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { requireUserId } from "@/lib/auth";
import { getDashboardStats, getCompletionTrend } from "@/services/analytics";
import { getTasks } from "@/actions/tasks";
import { getProjects } from "@/actions/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { CompletionTrendChart, PriorityBarChart } from "@/components/dashboard/charts";
import { PriorityBadge } from "@/components/tasks/task-badges";
import { PRIORITY_OPTIONS } from "@/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const userId = await requireUserId();
  const [stats, trend, upcoming, projects] = await Promise.all([
    getDashboardStats(userId),
    getCompletionTrend(userId, 14),
    getTasks({ status: ["TODO", "IN_PROGRESS", "REVIEW"] }, 1, 6),
    getProjects(),
  ]);

  const priorityData = PRIORITY_OPTIONS.map((p) => ({
    name: p.label,
    value: stats.priorityBreakdown[p.value],
    color: p.color,
  }));

  const weeklyPct = stats.weeklyTotal === 0 ? 0 : Math.round((stats.weeklyCompleted / stats.weeklyTotal) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s on your plate.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Due today" value={stats.todayCount} icon={CalendarClock} accent="text-blue-500" />
        <StatCard label="Upcoming" value={stats.upcomingCount} icon={CalendarCheck} accent="text-purple-500" />
        <StatCard label="Overdue" value={stats.overdueCount} icon={AlertTriangle} accent="text-red-500" />
        <StatCard label="Completed today" value={stats.completedTodayCount} icon={CheckCircle2} accent="text-emerald-500" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Completion trend</CardTitle>
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" /> Last 14 days
            </span>
          </CardHeader>
          <CardContent>
            <CompletionTrendChart data={trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productivity score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ProgressRing value={stats.productivityScore} label="today" />
            <div className="grid w-full grid-cols-2 gap-3 text-center text-sm">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-lg font-semibold">{stats.weeklyCompleted}</p>
                <p className="text-xs text-muted-foreground">Done this week</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-lg font-semibold">{weeklyPct}%</p>
                <p className="text-xs text-muted-foreground">Weekly rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming deadlines</CardTitle>
            <Link href="/tasks" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.items.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nothing scheduled. Enjoy the breathing room.</p>
            ) : (
              upcoming.items.map((task) => {
                const due = task.dueDate ? new Date(task.dueDate) : null;
                const overdue = due && isPast(due) && !isToday(due);
                return (
                  <div key={task.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      {due && (
                        <p className={cn("text-xs text-muted-foreground", overdue && "text-destructive")}>
                          {format(due, "EEE, MMM d")}
                        </p>
                      )}
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <PriorityBarChart data={priorityData} />
          </CardContent>
        </Card>
      </div>

      {projects.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Projects</CardTitle>
            <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((p) => (
              <div key={p.id} className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <p className="truncate font-medium">{p.name}</p>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p.progress}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {p.completedCount}/{p.taskCount} tasks · {p.progress}%
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
