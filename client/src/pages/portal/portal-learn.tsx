import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { PortalPageShell } from "@/lib/client-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase, toCamelArray } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  Target,
  Rocket,
  TrendingUp,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";

interface ModuleProgressRow {
  id: number;
  clientId: number;
  moduleId: string;
  stepId: string;
  completed: boolean;
  formData: Record<string, unknown> | null;
  updatedAt: string;
}

interface BeUEnrollmentRow {
  id: number;
  enrollmentId: string;
  status: string;
  progressPct: number;
  startedAt: string | null;
  completedAt: string | null;
  beUCourses?: {
    title: string;
    description: string | null;
    mode: string | null;
    tier: string | null;
    durationWeeks: number | null;
    externalUrl: string | null;
  } | null;
}

const MODE_DOT: Record<string, string> = {
  plan: "bg-blue-500",
  evolve: "bg-amber-500",
  succeed: "bg-purple-500",
};

const MODULE_DEFS = [
  {
    id: "plan",
    number: 1,
    title: "PLAN",
    subtitle: "Foundation & Clarity",
    description:
      "Build your strategic foundation with crystal-clear messaging, validated market positioning, and a profit-first financial structure.",
    icon: Target,
    color: "hsl(232,45%,18%)",
    accent: "hsl(83,60%,57%)",
    totalSteps: 20,
  },
  {
    id: "evolve",
    number: 2,
    title: "EVOLVE",
    subtitle: "Build & Launch",
    description:
      "Transform your vision into a launch-ready business with professional brand assets, automated systems, and a 90-day execution plan.",
    icon: Rocket,
    color: "hsl(232,45%,18%)",
    accent: "hsl(83,60%,57%)",
    totalSteps: 25,
  },
  {
    id: "succeed",
    number: 3,
    title: "SUCCEED",
    subtitle: "Growth Engine",
    description:
      "Scale your impact with strategic marketing campaigns, performance metrics, and client success systems that drive sustainable growth.",
    icon: TrendingUp,
    color: "hsl(232,45%,18%)",
    accent: "hsl(83,60%,57%)",
    totalSteps: 30,
  },
] as const;

export default function PortalLearnPage() {
  const { becsUser } = useAuth();

  // 1. Look up client record
  const clientQuery = useQuery<{ id: number } | null>({
    queryKey: ["portal", "client-id", becsUser?.email],
    enabled: !!becsUser?.email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id")
        .ilike("email", becsUser!.email)
        .eq("portal_access_active", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return toCamelArray<{ id: number }>([data])[0];
    },
  });

  const clientId = clientQuery.data?.id;

  // 2. Load module_progress rows for all three modules
  const progressQuery = useQuery<ModuleProgressRow[]>({
    queryKey: ["portal", "module-progress-all", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_progress")
        .select("*")
        .eq("client_id", clientId!)
        .in("module_id", ["plan", "evolve", "succeed"]);
      if (error) throw error;
      return toCamelArray<ModuleProgressRow>(data ?? []);
    },
  });

  const allRows = progressQuery.data ?? [];

  // BE University enrollments for this client (joins course title/mode)
  const enrollmentsQuery = useQuery<BeUEnrollmentRow[]>({
    queryKey: ["portal", "be-u-enrollments", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("be_u_enrollments")
        .select("id, enrollment_id, status, progress_pct, started_at, completed_at, be_u_courses(title, description, mode, tier, duration_weeks, external_url)")
        .eq("client_id", clientId!)
        .neq("status", "revoked")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        enrollmentId: row.enrollment_id,
        status: row.status,
        progressPct: row.progress_pct,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        beUCourses: row.be_u_courses
          ? {
              title: row.be_u_courses.title,
              description: row.be_u_courses.description,
              mode: row.be_u_courses.mode,
              tier: row.be_u_courses.tier,
              durationWeeks: row.be_u_courses.duration_weeks,
              externalUrl: row.be_u_courses.external_url,
            }
          : null,
      })) as BeUEnrollmentRow[];
    },
  });
  const enrollments = enrollmentsQuery.data ?? [];

  // Compute per-module completion counts (only counting actual step rows, not 'form')
  function modulePercent(moduleId: string, totalSteps: number): number {
    const completedSteps = allRows.filter(
      (r) => r.moduleId === moduleId && r.stepId !== "form" && r.completed
    ).length;
    if (totalSteps === 0) return 0;
    return Math.min(100, Math.round((completedSteps / totalSteps) * 100));
  }

  const planPct = modulePercent("plan", MODULE_DEFS[0].totalSteps);
  const evolvePct = modulePercent("evolve", MODULE_DEFS[1].totalSteps);
  const succeedPct = modulePercent("succeed", MODULE_DEFS[2].totalSteps);
  const overallPct = Math.round((planPct + evolvePct + succeedPct) / 3);

  return (
    <PortalPageShell>
      {/* Hero */}
      <section className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-wider text-[hsl(83,60%,45%)]">
          Program
        </div>
        <h1 className="mt-2 text-3xl lg:text-4xl font-bold text-slate-900">
          Your BECS P.E.S. Program
        </h1>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Work through each module at your own pace. Your progress is saved
          automatically. Complete all three phases — Plan, Evolve, Succeed — to
          build a profitable, scalable business.
        </p>
      </section>

      {/* My BE University courses */}
      {enrollments.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">My BE University courses</h2>
            <span className="text-xs text-slate-500">{enrollments.length} enrolled</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {enrollments.map((e) => {
              const c = e.beUCourses;
              const pct = e.progressPct ?? 0;
              const isComplete = pct >= 100 || e.status === "completed";
              return (
                <Card key={e.id} className="border-slate-200" data-testid={`portal-enrollment-${e.id}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {c?.mode && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                          <span className={`w-2 h-2 rounded-full ${MODE_DOT[c.mode] ?? "bg-slate-400"}`} />
                          {c.mode}
                        </span>
                      )}
                      {c?.tier && (
                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{c.tier}</span>
                      )}
                      {isComplete && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[hsl(83,60%,57%)]/15 text-[hsl(83,60%,35%)] ml-auto">
                          <CheckCircle2 size={11} /> Complete
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">{c?.title ?? "Course"}</h3>
                    {c?.description && <p className="text-xs text-slate-600 mb-3 line-clamp-2">{c.description}</p>}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Progress</span>
                        <span className="font-semibold text-slate-800">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-2 bg-slate-100 [&>div]:bg-[hsl(83,60%,57%)]" />
                    </div>
                    {c?.externalUrl ? (
                      <a href={c.externalUrl} target="_blank" rel="noreferrer" className="block">
                        <Button size="sm" className="w-full bg-[hsl(232,45%,18%)] hover:bg-[hsl(232,45%,12%)] text-white">
                          {pct > 0 ? "Continue" : "Open course"}
                          <ArrowRight size={14} className="ml-2" />
                        </Button>
                      </a>
                    ) : (
                      <Button size="sm" disabled className="w-full" variant="outline">
                        Course launching soon
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {clientQuery.isLoading || progressQuery.isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          Loading your program progress…
        </div>
      ) : (
        <>
          {/* Module cards grid */}
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {MODULE_DEFS.map((mod) => {
              const Icon = mod.icon;
              const pct =
                mod.id === "plan"
                  ? planPct
                  : mod.id === "evolve"
                    ? evolvePct
                    : succeedPct;
              const isStarted = pct > 0;

              return (
                <Card
                  key={mod.id}
                  className="border-slate-200 hover:shadow-md hover:border-[hsl(83,60%,57%)] transition-all"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-[hsl(232,45%,18%)] flex items-center justify-center">
                        <Icon size={22} className="text-[hsl(83,60%,57%)]" />
                      </div>
                      {isStarted && pct === 100 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-[hsl(83,60%,57%)]/15 text-[hsl(83,60%,35%)]">
                          <CheckCircle2 size={11} />
                          Complete
                        </span>
                      ) : isStarted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                          In progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                          Not started
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-base">
                      <span className="text-[hsl(232,45%,18%)] text-lg font-bold">
                        {mod.title}
                      </span>
                      <span className="block text-sm font-medium text-slate-500 mt-0.5">
                        Module {mod.number} — {mod.subtitle}
                      </span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                      {mod.description}
                    </p>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span>Progress</span>
                        <span className="font-semibold text-slate-800">
                          {pct}%
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        className="h-2 bg-slate-100 [&>div]:bg-[hsl(83,60%,57%)]"
                      />
                    </div>

                    <Link href={`/portal/learn/${mod.id}`}>
                      <a className="block">
                        <Button
                          size="sm"
                          className="w-full bg-[hsl(232,45%,18%)] hover:bg-[hsl(232,45%,12%)] text-white"
                        >
                          {isStarted ? "Continue module" : "Open module"}
                          <ArrowRight size={14} className="ml-2" />
                        </Button>
                      </a>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Overall progress card */}
          <Card className="border-slate-200 mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap
                      size={18}
                      className="text-[hsl(232,45%,18%)]"
                    />
                    <span className="text-sm font-bold text-slate-900">
                      Overall P.E.S. Progress
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Average across all three modules
                  </p>
                  <Progress
                    value={overallPct}
                    className="h-2.5 bg-slate-100 [&>div]:bg-[hsl(83,60%,57%)]"
                  />
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-4xl font-bold text-[hsl(232,45%,18%)]">
                    {overallPct}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">complete</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer note */}
          <p className="text-xs text-slate-400 text-center">
            Transformational business programs for solo entrepreneurs, startups,
            creators, and coaches.
          </p>
        </>
      )}
    </PortalPageShell>
  );
}
