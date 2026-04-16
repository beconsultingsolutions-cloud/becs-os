import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, toCamelArray, toCamel } from "@/lib/supabase";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Client, Project, Milestone, Meeting, LegalDoc, Recap, OnboardingItem, AddOn } from "@shared/schema";
import { ArrowLeft, CheckCircle2, Clock, Lock, CircleDot, CalendarDays, FileText, BookOpen, Sparkles } from "lucide-react";

function label(s: string) { return (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

function MilestoneStatusIcon({ status }: { status: string }) {
  if (status === "complete") return <CheckCircle2 size={16} className="text-green-500" />;
  if (status === "in_progress") return <CircleDot size={16} className="text-blue-500" />;
  if (status === "locked") return <Lock size={16} className="text-muted-foreground" />;
  return <Clock size={16} className="text-amber-500" />;
}

export default function ClientDetailPage() {
  const [, params] = useRoute("/clients/:id");
  const clientId = Number(params?.id);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: client } = useQuery<Client>({
    queryKey: ["clients", clientId],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("*").eq("id", clientId).single();
      return data ? (toCamel(data) as Client) : undefined as any;
    },
  });
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects-client", clientId],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
      return toCamelArray<Project>(data || []);
    },
  });
  const { data: meetings = [] } = useQuery<Meeting[]>({
    queryKey: ["meetings-client", clientId],
    queryFn: async () => {
      const { data } = await supabase.from("meetings").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
      return toCamelArray<Meeting>(data || []);
    },
  });
  const { data: legalDocs = [] } = useQuery<LegalDoc[]>({
    queryKey: ["legal-client", clientId],
    queryFn: async () => {
      const { data } = await supabase.from("legal_docs").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
      return toCamelArray<LegalDoc>(data || []);
    },
  });
  const { data: recaps = [] } = useQuery<Recap[]>({
    queryKey: ["recaps-client", clientId],
    queryFn: async () => {
      const { data } = await supabase.from("recaps").select("*").eq("client_id", clientId).order("generated_at", { ascending: false });
      return toCamelArray<Recap>(data || []);
    },
  });
  const { data: onboarding = [] } = useQuery<OnboardingItem[]>({
    queryKey: ["onboarding", clientId],
    queryFn: async () => {
      const { data } = await supabase.from("onboarding_items").select("*").eq("client_id", clientId).order("sort_order");
      return toCamelArray<OnboardingItem>(data || []);
    },
  });
  const { data: addons = [] } = useQuery<AddOn[]>({
    queryKey: ["addons-client", clientId],
    queryFn: async () => {
      const { data } = await supabase.from("add_ons").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
      return toCamelArray<AddOn>(data || []);
    },
  });

  // Active project (first active)
  const activeProject = projects.find((p) => p.status === "active") || projects[0];

  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: ["milestones-project", activeProject?.id],
    queryFn: async () => {
      if (!activeProject) return [];
      const { data } = await supabase.from("milestones").select("*").eq("project_id", activeProject.id).order("sort_order");
      return toCamelArray<Milestone>(data || []);
    },
    enabled: !!activeProject,
  });

  const updateMilestone = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { error } = await supabase.from("milestones").update({ status, completed_at: status === "complete" ? new Date().toISOString() : null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["milestones-project", activeProject?.id] });
      toast({ title: "Milestone updated" });
    },
  });

  const updateOnboarding = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { error } = await supabase.from("onboarding_items").update({ status, completed_at: status === "complete" ? new Date().toISOString() : null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onboarding", clientId] });
    },
  });

  if (!client) return <div className="p-6 text-muted-foreground">Loading client…</div>;

  const onboardingDone = onboarding.filter((i) => i.status === "complete").length;
  const onboardingPct = onboarding.length > 0 ? Math.round((onboardingDone / onboarding.length) * 100) : 0;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Back */}
      <Link href="/clients">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back-clients">
          <ArrowLeft size={14} /> Back to Clients
        </button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <h1 className="text-xl font-bold">{client.name}</h1>
            {client.businessName && <p className="text-sm text-muted-foreground">{client.businessName}</p>}
            <p className="text-xs text-muted-foreground">{client.email} {client.phone && `· ${client.phone}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`status-${client.status} text-xs font-semibold px-3 py-1 rounded-full`}>{label(client.status)}</span>
          {client.portalAccessActive ? (
            <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:border-green-700 dark:text-green-400">Portal Active</Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground">Portal Locked</Badge>
          )}
        </div>
      </div>

      {/* Project progress summary */}
      {activeProject && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <p className="font-semibold text-sm">{activeProject.title}</p>
                <p className="text-xs text-muted-foreground">{label(activeProject.serviceType)} · Phase: {activeProject.currentPhase}</p>
              </div>
              <span className="text-lg font-bold text-primary">{activeProject.progressPercent}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${activeProject.progressPercent}%` }} />
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span>Started {activeProject.startDate ? new Date(activeProject.startDate).toLocaleDateString() : "—"}</span>
              <span>Target {activeProject.targetEndDate ? new Date(activeProject.targetEndDate).toLocaleDateString() : "—"}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="milestones">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="milestones" className="text-xs">Milestones</TabsTrigger>
          <TabsTrigger value="onboarding" className="text-xs">Onboarding</TabsTrigger>
          <TabsTrigger value="meetings" className="text-xs">Meetings</TabsTrigger>
          <TabsTrigger value="legal" className="text-xs">Legal & Docs</TabsTrigger>
          <TabsTrigger value="recaps" className="text-xs">Recaps</TabsTrigger>
          <TabsTrigger value="addons" className="text-xs">Add-ons</TabsTrigger>
        </TabsList>

        {/* Milestones */}
        <TabsContent value="milestones" className="mt-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Project Milestones</CardTitle></CardHeader>
            <CardContent className="p-0 pb-2">
              {milestones.length === 0 ? (
                <p className="px-5 py-8 text-center text-muted-foreground text-sm">No milestones yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {milestones.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 px-5 py-3" data-testid={`milestone-row-${m.id}`}>
                      <MilestoneStatusIcon status={m.status} />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${m.status === "complete" ? "line-through text-muted-foreground" : ""}`}>{m.title}</p>
                        {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                        {m.dueDate && <p className="text-xs text-muted-foreground mt-0.5">Due: {new Date(m.dueDate).toLocaleDateString()}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {m.clientActionRequired ? <Badge variant="outline" className="text-xs border-amber-300 text-amber-600">Client action</Badge> : null}
                        <Select
                          value={m.status}
                          onValueChange={(v) => updateMilestone.mutate({ id: m.id, status: v })}
                        >
                          <SelectTrigger className="h-7 w-32 text-xs" data-testid={`milestone-status-${m.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["pending","in_progress","complete","locked","reopened"].map((s) => (
                              <SelectItem key={s} value={s}>{label(s)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onboarding */}
        <TabsContent value="onboarding" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Onboarding Checklist</CardTitle>
              <span className="text-xs text-muted-foreground">{onboardingDone}/{onboarding.length} complete ({onboardingPct}%)</span>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <div className="px-5 pb-3">
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${onboardingPct}%` }} />
                </div>
              </div>
              {onboarding.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/30 transition-colors" data-testid={`onboarding-item-${item.id}`}>
                  <button
                    onClick={() => updateOnboarding.mutate({ id: item.id, status: item.status === "complete" ? "pending" : "complete" })}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${item.status === "complete" ? "bg-green-500 border-green-500 text-white" : "border-border hover:border-primary"}`}
                    data-testid={`onboarding-check-${item.id}`}
                  >
                    {item.status === "complete" && <CheckCircle2 size={12} />}
                  </button>
                  <span className={`text-sm ${item.status === "complete" ? "line-through text-muted-foreground" : ""}`}>{item.item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meetings */}
        <TabsContent value="meetings" className="mt-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Meeting History</CardTitle></CardHeader>
            <CardContent className="p-0 pb-2">
              {meetings.length === 0 ? (
                <p className="px-5 py-8 text-center text-muted-foreground text-sm">No meetings yet.</p>
              ) : meetings.map((meeting) => (
                <div key={meeting.id} className="px-5 py-3 border-b border-border last:border-0" data-testid={`meeting-detail-${meeting.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={14} className="text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{meeting.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {meeting.scheduledAt ? new Date(meeting.scheduledAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "TBD"}
                          {meeting.duration ? ` · ${meeting.duration} min` : ""}
                        </p>
                      </div>
                    </div>
                    <span className={`status-${meeting.status} text-xs font-medium px-2 py-0.5 rounded-full shrink-0`}>{label(meeting.status)}</span>
                  </div>
                  {meeting.recap && (
                    <div className="mt-2 ml-5 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Recap</p>
                      <p className="text-xs leading-relaxed">{meeting.recap}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legal */}
        <TabsContent value="legal" className="mt-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Legal & Documents</CardTitle></CardHeader>
            <CardContent className="p-0 pb-2">
              {legalDocs.length === 0 ? (
                <p className="px-5 py-8 text-center text-muted-foreground text-sm">No documents yet.</p>
              ) : legalDocs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0" data-testid={`doc-row-${doc.id}`}>
                  <FileText size={14} className="text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">{label(doc.type)} · {doc.docId}</p>
                    {doc.amount && <p className="text-xs text-muted-foreground">${doc.amount.toLocaleString()}</p>}
                  </div>
                  <span className={`status-${doc.status} text-xs font-medium px-2 py-0.5 rounded-full`}>{label(doc.status)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recaps */}
        <TabsContent value="recaps" className="mt-4">
          <div className="space-y-3">
            {recaps.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No recaps yet.</CardContent></Card>
            ) : recaps.map((recap) => (
              <Card key={recap.id} data-testid={`recap-card-${recap.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BookOpen size={14} className="text-primary" />
                      {recap.title}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">{new Date(recap.generatedAt).toLocaleDateString()}</span>
                  </div>
                  <Badge variant="outline" className="text-xs w-fit">{label(recap.type)}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{recap.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Add-ons */}
        <TabsContent value="addons" className="mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {addons.length === 0 ? (
              <Card className="sm:col-span-2"><CardContent className="py-8 text-center text-muted-foreground text-sm">No add-ons yet.</CardContent></Card>
            ) : addons.map((addon) => (
              <Card key={addon.id} className="border-dashed" data-testid={`addon-card-${addon.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(83,60%,57%)]/20 flex items-center justify-center">
                      <Sparkles size={14} className="text-[hsl(83,60%,45%)] dark:text-[hsl(83,60%,57%)]" />
                    </div>
                    <span className={`status-${addon.status} text-xs font-medium px-2 py-0.5 rounded-full`}>{label(addon.status)}</span>
                  </div>
                  <p className="font-semibold text-sm mt-2">{addon.title}</p>
                  {addon.description && <p className="text-xs text-muted-foreground mt-1">{addon.description}</p>}
                  {addon.price && <p className="text-sm font-bold text-primary mt-2">${addon.price.toLocaleString()}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
