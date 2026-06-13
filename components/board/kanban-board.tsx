"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format, isPast, isToday } from "date-fns";
import { Calendar, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "@/components/tasks/task-badges";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { moveTask } from "@/actions/tasks";
import { BOARD_COLUMNS } from "@/types";
import type { Category, Project, TaskStatus, TaskWithRelations } from "@/types";

interface KanbanBoardProps {
  initialTasks: TaskWithRelations[];
  projects: Project[];
  categories: Category[];
}

export function KanbanBoard({ initialTasks, projects, categories }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>(initialTasks);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);

  // Keep local state in sync if the server data changes (e.g. after creating a task).
  useEffect(() => setTasks(initialTasks), [initialTasks]);

  function onDrop(status: TaskStatus) {
    setOverCol(null);
    if (!dragId) return;
    const task = tasks.find((t) => t.id === dragId);
    if (!task || task.status === status) {
      setDragId(null);
      return;
    }

    const colTasks = tasks.filter((t) => t.status === status);
    const position = (colTasks[colTasks.length - 1]?.position ?? 0) + 1;

    // Optimistic update
    const prev = tasks;
    setTasks((cur) => cur.map((t) => (t.id === dragId ? { ...t, status, position } : t)));
    setDragId(null);

    moveTask(task.id, status, position).then((res) => {
      if (!res.success) {
        setTasks(prev);
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
      {BOARD_COLUMNS.map((col) => {
        const colTasks = tasks
          .filter((t) => t.status === col.id)
          .sort((a, b) => a.position - b.position);
        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(col.id);
            }}
            onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
            onDrop={() => onDrop(col.id)}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-xl border bg-muted/30 transition-colors",
              overCol === col.id && "border-primary bg-primary/5",
            )}
          >
            <div className="flex items-center justify-between border-b px-3 py-2.5">
              <span className="text-sm font-semibold">{col.label}</span>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                {colTasks.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-2">
              {colTasks.map((task) => {
                const due = task.dueDate ? new Date(task.dueDate) : null;
                const overdue = due && col.id !== "COMPLETED" && isPast(due) && !isToday(due);
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDragId(task.id)}
                    onDragEnd={() => setDragId(null)}
                    className={cn(
                      "group cursor-grab rounded-lg border bg-card p-3 shadow-sm active:cursor-grabbing",
                      dragId === task.id && "opacity-50",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
                      <div className="min-w-0 flex-1">
                        <TaskDialog
                          projects={projects}
                          categories={categories}
                          task={task}
                          trigger={
                            <button className="text-left text-sm font-medium leading-snug hover:underline">
                              {task.title}
                            </button>
                          }
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <PriorityBadge priority={task.priority} />
                          {task.project && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: task.project.color }} />
                              {task.project.name}
                            </span>
                          )}
                          {due && (
                            <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", overdue && "text-destructive")}>
                              <Calendar className="h-3 w-3" /> {format(due, "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {colTasks.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  Drop tasks here
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
