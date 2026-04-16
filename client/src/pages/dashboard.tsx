import { useQuery } from "@tanstack/react-query";
import { supabase, toCamelArray } from "@/lib/supabase";
import { useEntity } from "@/lib/entity-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  TrendingUp, UserCheck, Briefcase, DollarSign,
  AlertCircle, CalendarDays, ArrowRight, Zap, CheckCircle2
} from "lucide-react";
import type { Lead, Client, Project, Meeting, AutomationEvent } from "@shared/schema";

function StatCard({ title, value, icon: Icon, sub, color = "primary" }: {
  title: string; value: string | number; icon: any; sub?: string; color?: string;
}) {
  return (
    <Card data-testid={`stat-${title.toLowerCase().replace(/\s/g, "-")}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-lg bg-primary/10`}>
            <Icon size={18} className="text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Dashboard() {
  const { currentEntity } = useEntity();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", currentEntity],
    queryFn: async () => {
      const [leadsRes, clientsRes, projectsRes, revenueRes, newLeadsRes, meetingsRes] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("entity_id", currentEntity),
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active").eq("entity_id", currentEntity),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active").eq("entity_id", currentEntity),
        supabase.from("legal_docs").select("amount").eq("status", "paid").eq("entity_id", currentEntity),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new").eq("entity_id", currentEntity),
        supabase.from("meetings").select("id", { count: "exact", head: true }).eq("status", "scheduled").eq("entity_id", currentEntity),
      ]);
      const revenue = (revenueRes.data || []).reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
      return {
        totalLeads: leadsRes.count || 0,
        activeClients: clientsRes.count || 0,
        activeProjects: projectsRes.count || 0,
        revenue,
        newLeads: newLeadsRes.count || 0,
        upcomingMeetings: meetingsRes.count || 0,
      };
    },
  });
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["leads", currentEntity],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("*").eq("entity_id", currentEntity).order("created_at", { ascending: false });
      return toCamelArray<Lead>(data || []);
    },
  });
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["clients", currentEntity],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("*").eq("entity_id", currentEntity).order("created_at", { ascending: false });
      return toCamelArray<Client>(data || []);
    },
  });
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects", currentEntity],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").eq("entity_id", currentEntity).order("created_at", { ascending: false });
      return toCamelArray<Project>(data || []);
    },
  });
  const { data: meetings = [] } = useQuery<Meeting[]>({
    queryKey: ["meetings", currentEntity],
    queryFn: async () => {
      const { data } = await supabase.from("meetings").select("*").eq("entity_id", currentEntity).order("created_at", { ascending: false });
      return toCamelArray<Meeting>(data || []);
    },
  });
  const { data: events = [] } = useQuery<AutomationEvent[]>({
    queryKey: ["automation-events", currentEntity],
    queryFn: async () => {
      const { data } = await supabase.from("automation_events").select("*").eq("entity_id", currentEntity).order("triggered_at", { ascending: false });
      return toCamelArray<AutomationEvent>(data || []);
    },
  });

  const recentLeads = leads.slice(0, 4);
  const activeProjects = projects.filter((p) => p.status === "active").slice(0, 3);
  const upcomingMeetings = meetings.filter((m) => m.status === "scheduled").slice(0, 4);
  const recentEvents = events.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Control Tower</h1>
        <p className="text-sm text-muted-foreground mt-0.5">BECS OS — Lead → Qualify → Propose → Contract → Onboard → Deliver → Complete → Expand</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard title="Total Leads" value={stats?.totalLeads ?? "—"} icon={TrendingUp} />
        <StatCard title="New Leads" value={stats?.newLeads ?? "—"} icon={AlertCircle} sub="Awaiting review" />
        <StatCard title="Active Clients" value={stats?.activeClients ?? "—"} icon={UserCheck} />
        <StatCard title="Active Projects" value={stats?.activeProjects ?? "—"} icon={Briefcase} />
        <StatCard title="Meetings" value={stats?.upcomingMeetings ?? "—"} icon={CalendarDays} sub="Scheduled" />
        <StatCard
          title="Revenue"
          value={stats?.revenue ? `$${Number(stats.revenue).toLocaleString()}` : "$0"}
          icon={DollarSign}
          sub="Payments received"
        />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left col — Leads + Meetings */}
        <div className="lg:col-span-2 space-y-5">
          {/* Recent Leads */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold">Recent Leads</CardTitle>
              <Link href="/leads" className="text-xs text-primary flex items-center gap-1 hover:underline">
                View all <ArrowRight size={12} />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentLeads.length === 0 ? (
                <div className="px-5 py-8 text-center text-muted-foreground text-sm">No leads yet. They'll appear here once captured.</div>
              ) : (
                <div className="divide-y divide-border">
                  {recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors" data-testid={`lead-row-${lead.id}`}>
                      <div>
                        <p className="text-sm font-medium text-foreground">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.businessName || lead.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`status-${lead.status} text-xs font-medium px-2 py-0.5 rounded-full`}>
                          {statusLabel(lead.status)}
                        </span>
                        <span className="text-xs text-muted-foreground hidden sm:block">{lead.serviceInterest?.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Projects */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold">Active Projects</CardTitle>
              <Link href="/projects" className="text-xs text-primary flex items-center gap-1 hover:underline">
                View all <ArrowRight size={12} />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {activeProjects.length === 0 ? (
                <div className="px-5 py-8 text-center text-muted-foreground text-sm">No active projects yet.</div>
              ) : (
                <div className="divide-y divide-border">
                  {activeProjects.map((project) => (
                    <div key={project.id} className="px-5 py-3" data-testid={`project-row-${project.id}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{project.title}</p>
                          <p className="text-xs text-muted-foreground">{project.currentPhase} — {project.serviceType?.replace(/_/g, " ")}</p>
                        </div>
                        <span className="text-xs font-semibold text-primary shrink-0">{project.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${project.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Meetings */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold">Upcoming Meetings</CardTitle>
              <Link href="/meetings" className="text-xs text-primary flex items-center gap-1 hover:underline">
                View all <ArrowRight size={12} />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingMeetings.length === 0 ? (
                <div className="px-5 py-8 text-center text-muted-foreground text-sm">No meetings scheduled.</div>
              ) : (
                <div className="divide-y divide-border">
                  {upcomingMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors" data-testid={`meeting-row-${meeting.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <CalendarDays size={14} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{meeting.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {meeting.scheduledAt ? new Date(meeting.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "TBD"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">{meeting.type.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right col — Automation Log */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap size={14} className="text-primary" /> Automation Feed
              </CardTitle>
              <Link href="/automation" className="text-xs text-primary flex items-center gap-1 hover:underline">
                All <ArrowRight size={12} />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 px-4 py-3" data-testid={`event-row-${event.id}`}>
                    <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-foreground leading-snug">{event.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(event.triggeredAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
                {recentEvents.length === 0 && (
                  <div className="px-4 py-6 text-center text-muted-foreground text-sm">No automation events yet.</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Workflow lifecycle */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">P.E.S. Lifecycle</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-4">
              {[
                { label: "Lead Capture", done: (stats?.totalLeads ?? 0) > 0 },
                { label: "Qualification", done: leads.some((l: Lead) => l.status !== "new") },
                { label: "Proposal", done: (stats?.activeClients ?? 0) > 0 },
                { label: "Contract & Pay", done: (stats?.revenue ?? 0) > 0 },
                { label: "Onboarding", done: clients.some((c: Client) => c.onboardingComplete) },
                { label: "Delivery", done: (stats?.activeProjects ?? 0) > 0 },
                { label: "Completion", done: false },
                { label: "Expand", done: false },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${step.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {step.done ? "✓" : i + 1}
                  </div>
                  <span className={`text-xs ${step.done ? "text-foreground font-medium" : "text-muted-foreground"}`}>{step.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
