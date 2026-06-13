"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isToday,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { updateTask } from "@/actions/tasks";
import type { Category, Project, TaskWithRelations } from "@/types";

const PRIORITY_DOT: Record<string, string> = {
  LOW: "bg-emerald-500",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-amber-500",
  URGENT: "bg-red-500",
};

interface CalendarViewProps {
  tasks: TaskWithRelations[];
  projects: Project[];
  categories: Category[];
}

export function CalendarView({ tasks: initial, projects, categories }: CalendarViewProps) {
  const [cursor, setCursor] = useState(new Date());
  const [tasks, setTasks] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, TaskWithRelations[]>();
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const key = format(new Date(t.dueDate), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    });
    return map;
  }, [tasks]);

  function reschedule(day: Date) {
    if (!dragId) return;
    const task = tasks.find((t) => t.id === dragId);
    setDragId(null);
    if (!task) return;
    const newDue = new Date(day);
    if (task.dueDate) {
      const old = new Date(task.dueDate);
      newDue.setHours(old.getHours(), old.getMinutes());
    } else {
      newDue.setHours(9, 0);
    }
    const prev = tasks;
    setTasks((cur) => cur.map((t) => (t.id === dragId ? { ...t, dueDate: newDue } : t)));
    updateTask({ id: task.id, dueDate: newDue.toISOString() }).then((res) => {
      if (!res.success) {
        setTasks(prev);
        toast.error(res.error);
      } else {
        toast.success("Task rescheduled");
      }
    });
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">{format(cursor, "MMMM yyyy")}</h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
          <Button variant="ghost" size="icon" onClick={() => setCursor((c) => subMonths(c, 1))} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b text-center text-xs font-medium text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = byDay.get(key) ?? [];
          const inMonth = isSameMonth(day, cursor);
          return (
            <div
              key={key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => reschedule(day)}
              className={cn(
                "min-h-[110px] border-b border-r p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0",
                !inMonth && "bg-muted/30 text-muted-foreground",
              )}
            >
              <div className="mb-1 flex justify-end">
                <span className={cn(
                  "grid h-6 w-6 place-items-center rounded-full text-xs",
                  isToday(day) && "bg-primary font-semibold text-primary-foreground",
                )}>
                  {format(day, "d")}
                </span>
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDragId(task.id)}
                    onDragEnd={() => setDragId(null)}
                  >
                    <TaskDialog
                      projects={projects}
                      categories={categories}
                      task={task}
                      trigger={
                        <button className="flex w-full items-center gap-1 truncate rounded bg-muted px-1.5 py-0.5 text-left text-xs hover:bg-accent">
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", PRIORITY_DOT[task.priority])} />
                          <span className={cn("truncate", task.status === "COMPLETED" && "line-through opacity-60")}>{task.title}</span>
                        </button>
                      }
                    />
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <p className="px-1 text-[10px] text-muted-foreground">+{dayTasks.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
