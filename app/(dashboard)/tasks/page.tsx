import { Suspense } from "react";
import { getTasks } from "@/actions/tasks";
import { getProjects } from "@/actions/projects";
import { getCategories } from "@/actions/taxonomy";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { TaskFiltersBar } from "@/components/tasks/task-filters";
import { TaskList } from "@/components/tasks/task-list";
import { ExportButton } from "@/components/tasks/export-button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Priority, TaskStatus, TaskFilters } from "@/types";

export const metadata = { title: "Tasks" };

function parseFilters(sp: Record<string, string | undefined>): TaskFilters {
  return {
    status: sp.status ? [sp.status as TaskStatus] : undefined,
    priority: sp.priority ? [sp.priority as Priority] : undefined,
    projectId: sp.projectId || undefined,
    categoryId: sp.categoryId || undefined,
    tagId: sp.tagId || undefined,
    search: sp.search || undefined,
  };
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const [projects, categories] = await Promise.all([getProjects(), getCategories()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">Create, organize and track everything you need to do.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton filters={filters} />
          <TaskDialog projects={projects} categories={categories} />
        </div>
      </div>

      <TaskFiltersBar projects={projects} categories={categories} />

      <Suspense fallback={<TaskListSkeleton />}>
        <TaskListData filters={filters} projects={projects} categories={categories} />
      </Suspense>
    </div>
  );
}

async function TaskListData({
  filters,
  projects,
  categories,
}: {
  filters: TaskFilters;
  projects: Awaited<ReturnType<typeof getProjects>>;
  categories: Awaited<ReturnType<typeof getCategories>>;
}) {
  const { items } = await getTasks(filters, 1, 100);
  return <TaskList tasks={items} projects={projects} categories={categories} />;
}

function TaskListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
