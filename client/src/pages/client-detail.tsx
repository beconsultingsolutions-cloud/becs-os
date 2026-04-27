import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, toCamelArray, toCamel, toSnake } from "@/lib/supabase";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import type { Client, Project, Milestone, Meeting, LegalDoc, Recap, OnboardingItem, AddOn, BeUEnrollment, BeUCourse } from "@shared/schema";
import { ArrowLeft, CheckCircle2, Clock, Lock, CircleDot, CalendarDays, FileText, BookOpen, Sparkles, Send, Trash2, ExternalLink, GraduationCap, UserPlus } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const MODE_BADGE_CSS: Record<string, string> = {
  plan:    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  evolve:  "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  succeed: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
};

function label(s: string) { return (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

function MilestoneStatusIcon({ status }: { status: string }) {
  if (status === "complete") return <CheckCircle2 size={16} className="text-green-500" />;
  if (status === "in_progress") return <CircleDot size={16} className="text-blue-500" />;
  if (status === "locked") return <Lock size={16} className="text-muted-foreground" />;
  return <Clock size={16} className="text-amber-500" />;
}

interface ClientMessage {
  id: number;
  clientId: number;
  entityId: string;
  senderUserId: string | null;
  senderRole: "admin" | "client";
  body: string;
  readAt: string | null;
  createdAt: string;
}

interface ClientDocument {
  id: number;
  clientId: number;
  projectId: number | null;
  entityId: string;
  title: string;
  fileUrl: string;
  kind: string;
  uploadedBy: string | null;
  visibleToClient: boolean;
  createdAt: string;
}

const DOC_KINDS = ["contract","proposal","deliverable","onboarding","report","invoice","other"];

export default function ClientDetailPage() {
  const [, params] = useRoute("/clients/:id");
  const clientId = Number(params?.id);
  const { toast } = useToast();
  const qc = useQueryClient();
  const { becsUser } = useAuth();

  // ── Message composer state ────────────────────────────────────────────
  const [msgDraft, setMsgDraft] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  // ── Document form state ───────────────────────────────────────────────
  const [docForm, setDocForm] = useState({ title: "", fileUrl: "", kind: "contract", visibleToClient: true });
  const updateDoc = (k: string, v: any) => setDocForm((f) => ({ ...f, [k]: v }));

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

  // ── BE University enrollments + course catalog for picker ─────────────
  const { data: enrollments = [] } = useQuery<(BeUEnrollment & { courseTitle?: string; courseMode?: string })[]>({
    queryKey: ["be-u-enrollments-client", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("be_u_enrollments")
        .select("*, be_u_courses(title, mode)")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...toCamel(row),
        courseTitle: row.be_u_courses?.title,
        courseMode:  row.be_u_courses?.mode,
      })) as any;
    },
    enabled: !!clientId,
  });
  const { data: allCourses = [] } = useQuery<BeUCourse[]>({
    queryKey: ["be-u-courses-published"],
    queryFn: async () => {
      const { data } = await supabase.from("be_u_courses").select("*").eq("is_published", true).order("mode").order("tier");
      return toCamelArray<BeUCourse>(data || []);
    },
  });
  const [enrollPick, setEnrollPick] = useState<string>("");
  const enrolledIds = new Set(enrollments.map((e) => e.courseId));
  const enrollClient = useMutation({
    mutationFn: async (courseDbId: number) => {
      const { count } = await supabase.from("be_u_enrollments").select("id", { count: "exact", head: true });
      const enrollmentId = `BECS-EN-${String((count || 0) + 1).padStart(4, "0")}`;
      const { error } = await supabase.from("be_u_enrollments").insert({
        enrollment_id: enrollmentId,
        client_id: clientId,
        course_id: courseDbId,
        status: "enrolled",
        source: "admin_grant",
        started_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["be-u-enrollments-client", clientId] });
      setEnrollPick("");
      toast({ title: "Client enrolled" });
    },
    onError: (e: any) => toast({ title: "Enroll failed", description: e.message, variant: "destructive" }),
  });
  const removeEnrollment = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("be_u_enrollments").update({ status: "revoked" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["be-u-enrollments-client", clientId] });
      toast({ title: "Enrollment revoked" });
    },
  });

  // Messages query
  const { data: messages = [] } = useQuery<ClientMessage[]>({
    queryKey: ["admin-messages-client", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_messages")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return toCamelArray<ClientMessage>(data || []);
    },
    enabled: !!clientId,
  });

  // Documents query
  const { data: clientDocs = [] } = useQuery<ClientDocument[]>({
    queryKey: ["admin-docs-client", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_documents")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return toCamelArray<ClientDocument>(data || []);
    },
    enabled: !!clientId,
  });

  // Scroll messages to bottom when messages change
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const sendMessage = async () => {
    if (!msgDraft.trim() || !becsUser) return;
    setMsgSending(true);
    try {
      const { error } = await supabase.from("client_messages").insert({
        client_id: clientId,
        entity_id: client?.entityId ?? "becs",
        sender_user_id: String(becsUser.id),
        sender_role: "admin",
        body: msgDraft.trim(),
      });
      if (error) throw error;
      setMsgDraft("");
      qc.invalidateQueries({ queryKey: ["admin-messages-client", clientId] });
    } catch {
      toast({ title: "Failed to send message", variant: "destructive" });
    } finally {
      setMsgSending(false);
    }
  };

  const addDocument = useMutation({
    mutationFn: async () => {
      if (!docForm.title || !docForm.fileUrl) throw new Error("Title and URL required");
      const { error } = await supabase.from("client_documents").insert({
        client_id: clientId,
        entity_id: client?.entityId ?? "becs",
        title: docForm.title,
        file_url: docForm.fileUrl,
        kind: docForm.kind,
        visible_to_client: docForm.visibleToClient,
        uploaded_by: becsUser ? String(becsUser.id) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-docs-client", clientId] });
      toast({ title: "Document added" });
      setDocForm({ title: "", fileUrl: "", kind: "contract", visibleToClient: true });
    },
    onError: () => toast({ title: "Failed to add document", variant: "destructive" }),
  });

  const deleteDocument = useMutation({
    mutationFn: async (docId: number) => {
      const { error } = await supabase.from("client_documents").delete().eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-docs-client", clientId] });
      toast({ title: "Document removed" });
    },
    onError: () => toast({ title: "Failed to delete document", variant: "destructive" }),
  });

  if (!client) return <div className="p-6 text-muted-foreground">Loading client…</div>;

  const onboardingDone = onboarding.filter((i) => i.status === "complete").length;
  const onboardingPct = onboarding.length > 0 ? Math.round((onboardingDone / onboarding.length) * 100) : 0;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Back */}
      <Link href="/clients" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="button-back-clients">
        <ArrowLeft size={14} /> Back to Clients
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
          <TabsTrigger value="messages" className="text-xs">Messages</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
          <TabsTrigger value="courses" className="text-xs" data-testid="tab-courses">Courses</TabsTrigger>
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

        {/* Messages */}
        <TabsContent value="messages" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Client Messages</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="min-h-[200px] max-h-[50vh] overflow-y-auto p-5 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">No messages yet. Send one below.</p>
                ) : messages.map((m) => {
                  const isAdmin = m.senderRole === "admin";
                  const time = new Date(m.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
                  return (
                    <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`} data-testid={`msg-row-${m.id}`}>
                      <div className={`max-w-[80%] ${isAdmin ? "text-right" : ""}`}>
                        <div className={`inline-block px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                          isAdmin
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        }`}>
                          {m.body}
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground px-1">
                          {isAdmin ? "Admin" : "Client"} · {time}
                          {!isAdmin && !m.readAt && <span className="ml-1 text-amber-500">· Unread</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={msgEndRef} />
              </div>

              {/* Admin composer */}
              <div className="border-t border-border p-4 bg-muted/30">
                <div className="flex gap-2">
                  <Textarea
                    value={msgDraft}
                    onChange={(e) => setMsgDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    rows={2}
                    placeholder="Write a message to the client… (Cmd/Ctrl+Enter to send)"
                    className="flex-1 resize-none text-sm"
                    data-testid="input-admin-message"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={msgSending || !msgDraft.trim()}
                    size="sm"
                    className="self-end"
                    data-testid="button-send-message"
                  >
                    <Send size={14} className="mr-1" /> Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="mt-4">
          <div className="space-y-4">
            {/* Add document form */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Add Document</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Title *</Label>
                    <Input
                      value={docForm.title}
                      onChange={(e) => updateDoc("title", e.target.value)}
                      placeholder="e.g. Signed Contract Q1"
                      data-testid="input-doc-title"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Kind</Label>
                    <Select value={docForm.kind} onValueChange={(v) => updateDoc("kind", v)}>
                      <SelectTrigger data-testid="select-doc-kind"><SelectValue /></SelectTrigger>
                      <SelectContent>{DOC_KINDS.map((k) => <SelectItem key={k} value={k}>{label(k)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">File URL * (Google Drive, Dropbox, etc.)</Label>
                    <Input
                      value={docForm.fileUrl}
                      onChange={(e) => updateDoc("fileUrl", e.target.value)}
                      placeholder="https://drive.google.com/file/d/…"
                      data-testid="input-doc-url"
                    />
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <input
                      type="checkbox"
                      id="visibleToClient"
                      checked={docForm.visibleToClient}
                      onChange={(e) => updateDoc("visibleToClient", e.target.checked)}
                      className="h-4 w-4 rounded border border-input"
                      data-testid="checkbox-doc-visible"
                    />
                    <Label htmlFor="visibleToClient" className="text-xs cursor-pointer">Visible to client in portal</Label>
                  </div>
                </div>
                <Button
                  className="mt-3"
                  size="sm"
                  onClick={() => addDocument.mutate()}
                  disabled={addDocument.isPending || !docForm.title || !docForm.fileUrl}
                  data-testid="button-add-document"
                >
                  {addDocument.isPending ? "Adding…" : "Add Document"}
                </Button>
              </CardContent>
            </Card>

            {/* Documents list */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Documents ({clientDocs.length})</CardTitle></CardHeader>
              <CardContent className="p-0 pb-2">
                {clientDocs.length === 0 ? (
                  <p className="px-5 py-8 text-center text-muted-foreground text-sm">No documents added yet.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {clientDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 px-5 py-3" data-testid={`client-doc-row-${doc.id}`}>
                        <FileText size={14} className="text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {label(doc.kind)} · {new Date(doc.createdAt).toLocaleDateString()}
                            {doc.visibleToClient ? " · Visible to client" : " · Admin only"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            data-testid={`button-open-doc-${doc.id}`}
                            title="Open document"
                          >
                            <ExternalLink size={14} />
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                            onClick={() => deleteDocument.mutate(doc.id)}
                            data-testid={`button-delete-doc-${doc.id}`}
                            title="Delete document"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Courses (BE University) */}
        <TabsContent value="courses" className="mt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <GraduationCap size={14} /> Enroll in a course
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Select value={enrollPick} onValueChange={setEnrollPick}>
                    <SelectTrigger data-testid="select-enroll-course"><SelectValue placeholder="Pick a course" /></SelectTrigger>
                    <SelectContent>
                      {allCourses.filter((c) => !enrolledIds.has(c.id)).map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.title}{c.mode ? ` · ${label(c.mode)}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => enrollPick && enrollClient.mutate(parseInt(enrollPick, 10))}
                    disabled={!enrollPick || enrollClient.isPending}
                    data-testid="button-enroll-client"
                  >
                    <UserPlus size={14} className="mr-1" />
                    {enrollClient.isPending ? "Enrolling…" : "Enroll"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Clients are also auto-enrolled in their mode's foundation course when a proposal is accepted.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Active enrollments ({enrollments.filter(e => e.status !== "revoked").length})</CardTitle>
              </CardHeader>
              <CardContent>
                {enrollments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No enrollments yet.</p>
                ) : (
                  <div className="space-y-2">
                    {enrollments.map((e) => (
                      <div key={e.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border" data-testid={`enrollment-${e.id}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-muted-foreground">{e.enrollmentId}</span>
                            <span className="font-medium text-sm">{e.courseTitle ?? `Course #${e.courseId}`}</span>
                            {e.courseMode && <Badge className={`text-xs ${MODE_BADGE_CSS[e.courseMode]}`}>{label(e.courseMode)}</Badge>}
                            <Badge variant="outline" className="text-xs">{label(e.status)}</Badge>
                            <Badge variant="outline" className="text-xs">{label(e.source)}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary transition-all" style={{ width: `${e.progressPct}%` }} />
                            </div>
                            <span className="text-xs font-mono text-muted-foreground">{e.progressPct}%</span>
                          </div>
                        </div>
                        {e.status !== "revoked" && (
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 text-muted-foreground hover:text-destructive"
                            onClick={() => { if (confirm("Revoke this enrollment?")) removeEnrollment.mutate(e.id); }}
                            data-testid={`button-revoke-enrollment-${e.id}`}
                          >
                            <Trash2 size={13} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
