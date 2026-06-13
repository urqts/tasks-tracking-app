import * as XLSX from "xlsx";
import { format } from "date-fns";
import type { TaskWithRelations } from "@/types";

export interface ExportRow {
  "Task Name": string;
  Description: string;
  Status: string;
  Priority: string;
  Category: string;
  Project: string;
  "Due Date": string;
  "Created Date": string;
  "Completed Date": string;
}

const fmt = (d?: Date | string | null) => (d ? format(new Date(d), "yyyy-MM-dd") : "");

export function tasksToRows(tasks: TaskWithRelations[]): ExportRow[] {
  return tasks.map((t) => ({
    "Task Name": t.title,
    Description: t.description ?? "",
    Status: t.status,
    Priority: t.priority,
    Category: t.category?.name ?? "",
    Project: t.project?.name ?? "",
    "Due Date": fmt(t.dueDate),
    "Created Date": fmt(t.createdAt),
    "Completed Date": fmt(t.completedAt),
  }));
}

/** Build an .xlsx workbook (returned as a base64 string for download). */
export function buildXlsx(tasks: TaskWithRelations[]): string {
  const rows = tasksToRows(tasks);
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 32 }, { wch: 48 }, { wch: 14 }, { wch: 10 },
    { wch: 16 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tasks");
  return XLSX.write(wb, { type: "base64", bookType: "xlsx" });
}

/** Build a CSV string. */
export function buildCsv(tasks: TaskWithRelations[]): string {
  const rows = tasksToRows(tasks);
  const ws = XLSX.utils.json_to_sheet(rows);
  return XLSX.utils.sheet_to_csv(ws);
}
