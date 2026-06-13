import { requireUserId } from "@/lib/auth";
import {
  getDashboardStats,
  getCompletionTrend,
  getCategoryDistribution,
} from "@/services/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CompletionTrendChart,
  PriorityBarChart,
  CategoryPieChart,
} from "@/components/dashboard/charts";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/types";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const userId = await requireUserId();
  const [stats, trend30, categoryDist] = await Promise.all([
    getDashboardStats(userId),
    getCompletionTrend(userId, 30),
    getCategoryDistribution(userId),
  ]);

  const priorityData = PRIORITY_OPTIONS.map((p) => ({
    name: p.label,
    value: stats.priorityBreakdown[p.value],
    color: p.color,
  }));

  const statusData = STATUS_OPTIONS.filter((s) => s.value !== "ARCHIVED").map((s, i) => ({
    name: s.label,
    value: stats.statusBreakdown[s.value],
    color: ["#94a3b8", "#3b82f6", "#a855f7", "#10b981"][i] ?? "#94a3b8",
  }));

  const monthlyRate = stats.monthlyTotal === 0 ? 0 : Math.round((stats.monthlyCompleted / stats.monthlyTotal) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Understand your productivity patterns over time.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Completed this week</p><p className="mt-1 text-3xl font-bold">{stats.weeklyCompleted}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Completed this month</p><p className="mt-1 text-3xl font-bold">{stats.monthlyCompleted}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Monthly completion rate</p><p className="mt-1 text-3xl font-bold">{monthlyRate}%</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Overdue</p><p className="mt-1 text-3xl font-bold text-destructive">{stats.overdueCount}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Tasks completed (last 30 days)</CardTitle></CardHeader>
        <CardContent><CompletionTrendChart data={trend30} /></CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Priority distribution</CardTitle></CardHeader>
          <CardContent><PriorityBarChart data={priorityData} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Status distribution</CardTitle></CardHeader>
          <CardContent><PriorityBarChart data={statusData} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>By category</CardTitle></CardHeader>
          <CardContent><CategoryPieChart data={categoryDist} /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Productivity score</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <ProgressRing value={stats.productivityScore} size={160} label="today" />
        </CardContent>
      </Card>
    </div>
  );
}
