import Link from "next/link";
import { format } from "date-fns";
import { FolderKanban, CalendarClock } from "lucide-react";
import { getProjects } from "@/actions/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Group related tasks and track progress toward bigger goals.</p>
        </div>
        <ProjectDialog />
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project to organize tasks around a goal, course, or deliverable."
          action={<ProjectDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card key={p.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <CardTitle className="truncate">{p.name}</CardTitle>
                </div>
                {p.description && <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p.progress}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{p.completedCount}/{p.taskCount} tasks</span>
                  <span className="font-medium text-foreground">{p.progress}%</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {p.deadline ? (
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" /> {format(new Date(p.deadline), "MMM d, yyyy")}
                    </span>
                  ) : <span />}
                  <Link href={`/tasks?projectId=${p.id}`} className="text-primary hover:underline">
                    View tasks
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
