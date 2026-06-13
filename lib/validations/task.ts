import { z } from "zod";

export const PriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const StatusEnum = z.enum([
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
  "ARCHIVED",
]);
export const RecurrenceEnum = z.enum([
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
  "CUSTOM",
]);

const optionalDate = z
  .union([z.string(), z.date(), z.null()])
  .optional()
  .transform((v) => (v ? new Date(v) : null));

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional().nullable(),
  priority: PriorityEnum.default("MEDIUM"),
  status: StatusEnum.default("TODO"),
  startDate: optionalDate,
  dueDate: optionalDate,
  estimatedMinutes: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  actualMinutes: z.coerce.number().int().min(0).max(100000).optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateTaskSchema = taskSchema.partial().extend({
  id: z.string().uuid(),
});

export const subtaskSchema = z.object({
  taskId: z.string().uuid(),
  parentId: z.string().uuid().optional().nullable(),
  title: z.string().min(1, "Title is required").max(200),
});

export const projectSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(2000).optional().nullable(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Use a hex color like #6366f1")
    .default("#6366f1"),
  deadline: optionalDate,
});

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/).default("#64748b"),
  icon: z.string().max(40).optional().nullable(),
});

export const tagSchema = z.object({
  name: z.string().min(1, "Name is required").max(40),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/).default("#0ea5e9"),
});

export const recurringTaskSchema = z.object({
  title: z.string().min(1).max(200),
  frequency: RecurrenceEnum,
  interval: z.coerce.number().int().min(1).max(365).default(1),
  byWeekday: z.string().optional().nullable(),
  byMonthDay: z.coerce.number().int().min(1).max(31).optional().nullable(),
  startDate: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
  endDate: optionalDate,
  priority: PriorityEnum.default("MEDIUM"),
  estimatedMinutes: z.coerce.number().int().min(0).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
});

export const settingsSchema = z.object({
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
  defaultView: z.enum(["LIST", "BOARD", "CALENDAR", "DASHBOARD"]).optional(),
  timezone: z.string().max(64).optional(),
  language: z.string().max(8).optional(),
  weekStartsOn: z.coerce.number().int().min(0).max(6).optional(),
  browserNotifications: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  notifyDueToday: z.boolean().optional(),
  notifyDueTomorrow: z.boolean().optional(),
  notifyOverdue: z.boolean().optional(),
});

export type TaskInput = z.infer<typeof taskSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type TagInput = z.infer<typeof tagSchema>;
export type RecurringTaskInput = z.infer<typeof recurringTaskSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
