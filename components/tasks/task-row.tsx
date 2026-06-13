"use client";

import { useTransition } from "react";
import { format, isPast, isToday } from "date-fns";
import { Calendar, MoreHorizontal, Pencil, Trash2, Clock, Paperclip, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "@/components/tasks/task-badges";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { toggleTaskComplete, deleteTask } from "@/actions/tasks";
import type { Category, Project, TaskWithRelations } from "@/types";

interface TaskRowProps {
  task: TaskWithRelations;
  projects: Project[];
  categories: Category[];
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
}

export function TaskRow({ task, projects, categories, selected, onSelect }: TaskRowProps) {
  const [isPending, startTransition] = useTransition();
  const done = task.status === "COMPLETED";
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = due && !done && isPast(due) && !isToday(due);

  function toggle() {
    startTransition(async () => {
      const res = await toggleTaskComplete(task.id);
      if (!res.success) toast.error(res.error);
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteTask(task.id);
      if (res.success) toast.success("Task deleted");
      else toast.error(res.error);
    });
  }

  const subCount = task.subtasks?.length ?? 0;
  const subDone = task.subtasks?.filter((s) => s.completed).length ?? 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/40",
        isPending && "opacity-60",
      )}
    >
      <Checkbox checked={selected} onCheckedChange={(c) => onSelect(task.id, Boolean(c))} aria-label="Select task" />
      <Checkbox checked={done} onCheckedChange={toggle} aria-label="Complete task" className="rounded-full" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn("truncate font-medium", done && "text-muted-foreground line-through")}>
            {task.title}
          </p>
          <PriorityBadge priority={task.priority} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {task.project && (
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: task.project.color }} />
              {task.project.name}
            </span>
          )}
          {task.category && <span>{task.category.name}</span>}
          {due && (
            <span className={cn("inline-flex items-center gap-1", overdue && "text-destructive")}>
              <Calendar className="h-3 w-3" /> {format(due, "MMM d")}
            </span>
          )}
          {task.estimatedMinutes ? (
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {task.estimatedMinutes}m</span>
          ) : null}
          {subCount > 0 && (
            <span className="inline-flex items-center gap-1"><ListChecks className="h-3 w-3" /> {subDone}/{subCount}</span>
          )}
          {task.attachments?.length ? (
            <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" /> {task.attachments.length}</span>
          ) : null}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Task actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <TaskDialog
            projects={projects}
            categories={categories}
            task={task}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Pencil className="h-4 w-4" /> Edit
              </DropdownMenuItem>
            }
          />
          <DropdownMenuItem onClick={remove} className="text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
