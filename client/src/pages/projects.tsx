import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Project, Client } from "@shared/schema";
import { Briefcase, Calendar } from "lucide-react";

function label(s: string) { return (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

const SERVICE_COLORS: Record<string, string> = {
  reality_check: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  foundation_builder: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  business_launch: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  retainer: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  add_on: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
};

export default function ProjectsPage() {
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: () => apiRequest("GET", "/api/projects").then((r) => r.json()),
  });
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest("GET", "/api/clients").then((r) => r.json()),
  });

  const getClient = (id: number) => clients.find((c) => c.id === id);

  const active = projects.filter((p) => p.status === "active");
  const other = projects.filter((p) => p.status !== "active");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Projects</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{projects.length} total — {active.length} active</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-28 w-full rounded-lg" />)}</div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-3">Active Projects</h2>
              <div className="grid gap-4">
                {active.map((project) => {
                  const client = getClient(project.clientId);
                  return (
                    <Card key={project.id} className="border-primary/20" data-testid={`project-card-${project.id}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm">{project.title}</p>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SERVICE_COLORS[project.serviceType] || "bg-muted text-muted-foreground"}`}>
                                {label(project.serviceType)}
                              </span>
                            </div>
                            {client && <p className="text-xs text-muted-foreground">{client.name} — {client.businessName}</p>}
                            <p className="text-xs text-muted-foreground mt-0.5">Phase: {project.currentPhase} · {project.projectId}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-primary">{project.progressPercent}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mb-3">
                          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${project.progressPercent}%` }} />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar size={11} /> Start: {project.startDate ? new Date(project.startDate).toLocaleDateString() : "—"}</span>
                          <span className="flex items-center gap-1"><Calendar size={11} /> Target: {project.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString() : "—"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {other.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-3">Other Projects</h2>
              <div className="grid gap-3">
                {other.map((project) => (
                  <Card key={project.id} className="opacity-70" data-testid={`project-card-${project.id}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{project.title}</p>
                        <p className="text-xs text-muted-foreground">{label(project.serviceType)} · {label(project.status)}</p>
                      </div>
                      <span className={`status-${project.status} text-xs font-medium px-2 py-0.5 rounded-full`}>{label(project.status)}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {projects.length === 0 && (
            <Card><CardContent className="py-12 text-center">
              <Briefcase size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold text-sm">No projects yet</p>
              <p className="text-xs text-muted-foreground mt-1">Projects are created when a client is activated with a service assignment.</p>
            </CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}
