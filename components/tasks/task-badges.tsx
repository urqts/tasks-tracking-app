import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Priority, TaskStatus } from "@prisma/client";

const PRIORITY_STYLES: Record<Priority, string> = {
  LOW: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  MEDIUM: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  HIGH: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  URGENT: "bg-red-500/15 text-red-600 dark:text-red-400",
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  TODO: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  IN_PROGRESS: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  REVIEW: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  COMPLETED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  ARCHIVED: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="outline" className={cn("border-transparent capitalize", PRIORITY_STYLES[priority])}>
      {priority.toLowerCase()}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
