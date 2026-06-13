import type {
  Task,
  Subtask,
  Project,
  Category,
  Tag,
  Attachment,
  Reminder,
  Priority,
  TaskStatus,
} from "@prisma/client";

export type {
  Task,
  Subtask,
  Project,
  Category,
  Tag,
  Attachment,
  Reminder,
  Priority,
  TaskStatus,
};

/** A task with the relations we commonly hydrate for the UI. */
export type TaskWithRelations = Task & {
  project: Project | null;
  category: Category | null;
  subtasks: Subtask[];
  taskTags: { tag: Tag }[];
  attachments: Attachment[];
  _count?: { subtasks: number; attachments: number };
};

/** Project enriched with computed progress metrics. */
export type ProjectWithStats = Project & {
  taskCount: number;
  completedCount: number;
  progress: number; // 0-100
};

/** Standard result shape returned by all server actions. */
export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: Priority[];
  categoryId?: string;
  projectId?: string;
  tagId?: string;
  search?: string;
  dueBefore?: string;
  dueAfter?: string;
}

export interface DashboardStats {
  todayCount: number;
  upcomingCount: number;
  overdueCount: number;
  completedTodayCount: number;
  productivityScore: number;
  weeklyCompleted: number;
  weeklyTotal: number;
  monthlyCompleted: number;
  monthlyTotal: number;
  priorityBreakdown: Record<Priority, number>;
  statusBreakdown: Record<TaskStatus, number>;
}

export const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: "LOW", label: "Low", color: "#10b981" },
  { value: "MEDIUM", label: "Medium", color: "#3b82f6" },
  { value: "HIGH", label: "High", color: "#f59e0b" },
  { value: "URGENT", label: "Urgent", color: "#ef4444" },
];

export const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "REVIEW", label: "Review" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

export const BOARD_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "TODO", label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "REVIEW", label: "Review" },
  { id: "COMPLETED", label: "Completed" },
];
