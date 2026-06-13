import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { requireUser } from "@/lib/auth";
import { NotificationWatcher } from "@/components/notification-watcher";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar email={user.email} name={user.name} />
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
      {/* Schedules browser notifications for due/overdue tasks */}
      <NotificationWatcher />
    </div>
  );
}
