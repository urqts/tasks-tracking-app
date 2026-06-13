import { getTasks } from "@/actions/tasks";
import { getProjects } from "@/actions/projects";
import { getCategories } from "@/actions/taxonomy";
import { KanbanBoard } from "@/components/board/kanban-board";
import { TaskDialog } from "@/components/tasks/task-dialog";

export const metadata = { title: "Board" };

export default async function BoardPage() {
  const [{ items }, projects, categories] = await Promise.all([
    getTasks({ status: ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"] }, 1, 200),
    getProjects(),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Board</h1>
          <p className="text-sm text-muted-foreground">Drag tasks between columns to update their status.</p>
        </div>
        <TaskDialog projects={projects} categories={categories} />
      </div>

      <KanbanBoard initialTasks={items} projects={projects} categories={categories} />
    </div>
  );
}
