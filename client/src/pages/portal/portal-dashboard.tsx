import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { PortalPageShell } from "@/lib/client-layout";
import { Button } from "@/components/ui/button";
import { supabase, toCamelArray } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { SERVICE_LABELS, type ServiceType } from "@shared/schema";
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  MessagesSquare,
  FolderOpen,
  GraduationCap,
  Sparkles,
} from "lucide-react";

interface PortalClientRow {
  id: number;
  name: string;
  businessName: string | null;
  onboardingComplete: boolean;
  status: string;
}

interface PortalProjectRow {
  id: number;
  title: string;
  serviceType: string;
  status: string;
  currentPhase: string | null;
  progressPercent: number;
  targetEndDate: string | null;
}

interface PortalMilestoneRow {
  id: number;
  title: string;
  dueDate: string | null;
  status: string;
  projectId: number;
}

interface PortalMessageRow {
  id: number;
  body: string;
  senderRole: string;
  readAt: string | null;
  createdAt: string;
}

export default function PortalDashboardPage() {
  const { becsUser } = useAuth();

  // Look up the client record linked to the signed-in email
  const clientQuery = useQuery<PortalClientRow | null>({
    queryKey: ["portal", "client", becsUser?.email],
    enabled: !!becsUser?.email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .ilike("email", becsUser!.email)
        .eq("portal_access_active", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return toCamelArray<PortalClientRow>([data])[0];
    },
  });

  const clientId = clientQuery.data?.id;

  const projectsQuery = useQuery<PortalProjectRow[]>({
    queryKey: ["portal", "projects", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return toCamelArray<PortalProjectRow>(data ?? []);
    },
  });

  const milestonesQuery = useQuery<PortalMilestoneRow[]>({
    queryKey: ["portal", "milestones", clientId],
    enabled: !!clientId && (projectsQuery.data?.length ?? 0) > 0,
    queryFn: async () => {
      const projectIds = (projectsQuery.data ?? []).map((p) => p.id);
      if (!projectIds.length) return [];
      const { data, error } = await supabase
        .from("milestones")
        .select("*")
        .in("project_id", projectIds)
        .neq("status", "completed")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(3);
      if (error) throw error;
      return toCamelArray<PortalMilestoneRow>(data ?? []);
    },
  });

  const messagesQuery = useQuery<PortalMessageRow[]>({
    queryKey: ["portal", "messages-unread", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_messages")
        .select("*")
        .eq("client_id", clientId!)
        .eq("sender_role", "admin")
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return toCamelArray<PortalMessageRow>(data ?? []);
    },
  });

  const client = clientQuery.data;
  const projects = projectsQuery.data ?? [];
  const milestones = milestonesQuery.data ?? [];
  const unreadMessages = messagesQuery.data ?? [];
  const activeProject = projects.find((p) => p.status === "active") ?? projects[0];

  return (
    <PortalPageShell>
      {/* Welcome hero */}
      <section className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-wider text-[hsl(83,60%,45%)]">
          Your portal
        </div>
        <h1 className="mt-2 text-3xl lg:text-4xl font-bold text-slate-900">
          {greeting()}, {(becsUser?.displayName || "friend").split(" ")[0]}.
        </h1>
        <p className="mt-2 text-slate-600">
          {client?.businessName
            ? `Here's where ${client.businessName} stands today.`
            : "Here's where things stand today."}
        </p>
      </section>

      {clientQuery.isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          Loading your dashboard…
        </div>
      ) : !client ? (
        <NoClientRecord />
      ) : (
        <>
          {/* Top cards */}
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            <StatCard
              icon={<Briefcase size={18} />}
              label="Active projects"
              value={projects.filter((p) => p.status === "active").length.toString()}
              href="/portal/projects"
            />
            <StatCard
              icon={<CalendarClock size={18} />}
              label="Open milestones"
              value={milestones.length.toString()}
              href="/portal/projects"
            />
            <StatCard
              icon={<MessagesSquare size={18} />}
              label="Unread messages"
              value={unreadMessages.length.toString()}
              href="/portal/messages"
              emphasize={unreadMessages.length > 0}
            />
          </div>

          {/* Active project */}
          {activeProject ? (
            <div className="mb-8 rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Active engagement
                    </div>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">{activeProject.title}</h2>
                    <div className="mt-1 text-sm text-slate-500">
                      {SERVICE_LABELS[activeProject.serviceType as ServiceType] ?? activeProject.serviceType}
                    </div>
                  </div>
                  <span className="self-start inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[hsl(83,60%,57%)]/15 text-[hsl(83,60%,35%)]">
                    <Sparkles size={11} /> {activeProject.status}
                  </span>
                </div>

                {/* Progress */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span>Progress</span>
                    <span className="font-semibold text-slate-900">{activeProject.progressPercent}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[hsl(83,60%,57%)] transition-all"
                      style={{ width: `${Math.min(100, activeProject.progressPercent)}%` }}
                    />
                  </div>
                  {activeProject.currentPhase && (
                    <div className="mt-2 text-xs text-slate-500">
                      Current phase: <span className="font-semibold text-slate-700">{activeProject.currentPhase}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex">
                  <Link href="/portal/projects">
                    <a>
                      <Button
                        size="sm"
                        className="bg-[hsl(232,45%,18%)] hover:bg-[hsl(232,45%,12%)] text-white"
                        data-testid="view-project"
                      >
                        View project
                        <ArrowRight size={14} className="ml-2" />
                      </Button>
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8 rounded-xl bg-white border border-slate-200 p-8 text-center">
              <Briefcase className="mx-auto text-slate-300" size={32} />
              <h3 className="mt-3 font-bold text-slate-900">No active engagements yet</h3>
              <p className="mt-1 text-sm text-slate-500">
                Once your proposal is signed, your project will appear here.
              </p>
            </div>
          )}

          {/* Quick tiles */}
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            <QuickTile
              href="/portal/messages"
              icon={<MessagesSquare size={20} />}
              title="Messages"
              subtitle={
                unreadMessages.length
                  ? `${unreadMessages.length} new`
                  : "All caught up"
              }
            />
            <QuickTile
              href="/portal/documents"
              icon={<FolderOpen size={20} />}
              title="Documents"
              subtitle="Contracts · deliverables"
            />
            <QuickTile
              href="/portal/learn"
              icon={<GraduationCap size={20} />}
              title="Program"
              subtitle="Your curriculum"
            />
          </div>

          {/* Upcoming milestones */}
          {milestones.length > 0 && (
            <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="text-sm font-bold text-slate-900">Upcoming milestones</div>
                <Link href="/portal/projects">
                  <a className="text-xs text-slate-500 hover:text-slate-900 font-medium">View all</a>
                </Link>
              </div>
              <ul className="divide-y divide-slate-100">
                {milestones.map((m) => (
                  <li key={m.id} className="px-6 py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={14} className="text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{m.title}</div>
                        <div className="text-xs text-slate-500 capitalize">{m.status.replace("_", " ")}</div>
                      </div>
                    </div>
                    {m.dueDate && (
                      <div className="text-xs text-slate-500 flex-shrink-0 ml-3">
                        {new Date(m.dueDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </PortalPageShell>
  );
}

function greeting() {
  const hr = new Date().getHours();
  if (hr < 12) return "Good morning";
  if (hr < 18) return "Good afternoon";
  return "Good evening";
}

function StatCard({
  icon,
  label,
  value,
  href,
  emphasize,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
  emphasize?: boolean;
}) {
  return (
    <Link href={href}>
      <a className="block rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-[hsl(83,60%,57%)] transition-all" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
        <div className="flex items-center justify-between">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${emphasize ? "bg-[hsl(83,60%,57%)]/15 text-[hsl(83,60%,35%)]" : "bg-slate-100 text-slate-500"}`}>
            {icon}
          </div>
          <ArrowRight size={14} className="text-slate-400" />
        </div>
        <div className="mt-3 text-xs text-slate-500">{label}</div>
        <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      </a>
    </Link>
  );
}

function QuickTile({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href}>
      <a className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md hover:border-[hsl(83,60%,57%)] transition-all" data-testid={`tile-${title.toLowerCase()}`}>
        <div className="w-10 h-10 rounded-lg bg-[hsl(232,45%,18%)] text-[hsl(83,60%,57%)] flex items-center justify-center">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-slate-900">{title}</div>
          <div className="text-xs text-slate-500 truncate">{subtitle}</div>
        </div>
      </a>
    </Link>
  );
}

function NoClientRecord() {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-10 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
        <Briefcase size={22} className="text-slate-400" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900">Portal access pending</h3>
      <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
        Your account isn't linked to an active client record yet. This typically takes effect right
        after your proposal is signed and your first project is created. Reach out if you believe
        this is a mistake.
      </p>
    </div>
  );
}
