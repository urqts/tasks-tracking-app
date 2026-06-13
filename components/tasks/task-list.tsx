"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Trash2, ListTodo, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TaskRow } from "@/components/tasks/task-row";
import { EmptyState } from "@/components/empty-state";
import { bulkDelete, bulkUpdateStatus } from "@/actions/tasks";
import type { Category, Project, TaskWithRelations } from "@/types";

interface TaskListProps {
  tasks: TaskWithRelations[];
  projects: Project[];
  categories: Category[];
}

export function TaskList({ tasks, projects, categories }: TaskListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const ids = useMemo(() => tasks.map((t) => t.id), [tasks]);
  const allSelected = ids.length > 0 && selected.size === ids.length;

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(ids) : new Set());
  }

  function runBulk(fn: () => Promise<{ success: boolean; error?: string }>, msg: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.success) {
        toast.success(msg);
        setSelected(new Set());
      } else {
        toast.error(res.error ?? "Action failed");
      }
    });
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ListTodo}
        title="No tasks found"
        description="Create your first task or adjust your filters to see results."
      />
    );
  }

  const selectedIds = Array.from(selected);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={allSelected} onCheckedChange={(c) => toggleAll(Boolean(c))} />
          {selected.size > 0 ? `${selected.size} selected` : "Select all"}
        </label>

        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Button size="sm" variant="outline" disabled={isPending}
              onClick={() => runBulk(() => bulkUpdateStatus(selectedIds, "COMPLETED"), "Marked complete")}>
              <CheckCircle2 className="h-4 w-4" /> Complete
            </Button>
            <Button size="sm" variant="outline" disabled={isPending}
              onClick={() => runBulk(() => bulkDelete(selectedIds), "Tasks deleted")}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        )}
      </div>

      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          projects={projects}
          categories={categories}
          selected={selected.has(task.id)}
          onSelect={toggleOne}
        />
      ))}
    </div>
  );
}
