"use client";

import { useEffect, useRef } from "react";
import { getDueNotifications } from "@/actions/notifications";

const POLL_INTERVAL = 1000 * 60 * 15; // 15 minutes
const LABELS: Record<string, string> = {
  OVERDUE: "Overdue",
  DUE_TODAY: "Due today",
  DUE_TOMORROW: "Due tomorrow",
};

/**
 * Requests browser notification permission and periodically surfaces due /
 * overdue tasks as native notifications. De-dupes within a session so the same
 * task isn't re-notified on every poll.
 */
export function NotificationWatcher() {
  const notified = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "default") {
      // Defer the prompt slightly so it doesn't fire on first paint.
      const t = setTimeout(() => Notification.requestPermission().catch(() => {}), 4000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    let cancelled = false;

    async function poll() {
      if (Notification.permission !== "granted") return;
      try {
        const due = await getDueNotifications();
        if (cancelled) return;
        for (const n of due) {
          const key = `${n.id}:${n.type}`;
          if (notified.current.has(key)) continue;
          notified.current.add(key);
          new Notification(`TaskFlow — ${LABELS[n.type]}`, {
            body: n.title,
            tag: key,
            icon: "/icon-192.png",
          });
        }
      } catch {
        /* ignore polling errors */
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return null;
}
