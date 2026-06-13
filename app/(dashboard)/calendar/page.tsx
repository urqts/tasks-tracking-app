import { getTasks } from "@/actions/tasks";
import { getProjects } from "@/actions/projects";
import { getCategories } from "@/actions/taxonomy";
import { CalendarView } from "@/components/calendar/calendar-view";
import { TaskDialog } from "@/components/tasks/task-dialog";

export const metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const [{ items }, projects, categories] = await Promise.all([
    getTasks({}, 1, 500),
    getProjects(),
    getCategories(),
  ]);

  const scheduled = items.filter((t) => t.dueDate);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">Drag tasks to reschedule. Click to edit.</p>
        </div>
        <TaskDialog projects={projects} categories={categories} />
      </div>

      <CalendarView tasks={scheduled} projects={projects} categories={categories} />
    </div>
  );
}
