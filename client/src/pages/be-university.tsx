import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, toSnake, toCamelArray } from "@/lib/supabase";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { BeUCourse, BeUEnrollment, Client, BeUWebhookEvent } from "@shared/schema";
import { GraduationCap, Plus, Pencil, Trash2, UserPlus, ExternalLink, Webhook } from "lucide-react";

const MODE_OPTIONS = ["plan", "evolve", "succeed"] as const;
const TIER_OPTIONS = ["foundation", "core", "advanced", "retainer"] as const;
const STATUS_OPTIONS = ["enrolled", "in_progress", "completed", "dropped", "revoked"] as const;

const MODE_BADGE: Record<string, string> = {
  plan:    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  evolve:  "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  succeed: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
};

const STATUS_BADGE: Record<string, string> = {
  enrolled:    "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  completed:   "bg-green-100 text-green-700 border-green-200",
  dropped:     "bg-orange-100 text-orange-700 border-orange-200",
  revoked:     "bg-red-100 text-red-700 border-red-200",
};

function label(s: string | null | undefined) {
  return (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function priceDollars(cents: number): string {
  if (!cents) return "Free";
  return `$${(cents / 100).toLocaleString()}`;
}

const EMPTY_COURSE = {
  courseId: "",
  slug: "",
  title: "",
  description: "",
  mode: "",
  tier: "foundation",
  priceCents: 0,
  durationWeeks: 4,
  externalUrl: "",
  isPublished: true,
};

export default function BeUniversityPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [tab, setTab] = useState("courses");
  const [courseDialog, setCourseDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<BeUCourse | null>(null);
  const [courseForm, setCourseForm] = useState({ ...EMPTY_COURSE });

  const [enrollDialog, setEnrollDialog] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ clientId: "", courseId: "" });

  // ─── Queries ─────────────────────────────────────────────────────────
  const { data: courses = [] } = useQuery<BeUCourse[]>({
    queryKey: ["be-u-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("be_u_courses").select("*").order("mode").order("tier");
      if (error) throw error;
      return toCamelArray<BeUCourse>(data || []);
    },
  });

  const { data: enrollments = [] } = useQuery<(BeUEnrollment & { courseTitle?: string; courseMode?: string; clientName?: string })[]>({
    queryKey: ["be-u-enrollments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("be_u_enrollments")
        .select("*, be_u_courses(title, mode), clients(name, business_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...toCamelArray<BeUEnrollment>([row])[0],
        courseTitle: row.be_u_courses?.title,
        courseMode:  row.be_u_courses?.mode,
        clientName:  row.clients?.name || row.clients?.business_name,
      }));
    },
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["clients-list-for-enroll"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, client_id, name, business_name, portal_access_active").eq("portal_access_active", true).order("name");
      if (error) throw error;
      return toCamelArray<Client>(data || []);
    },
  });

  const { data: events = [] } = useQuery<BeUWebhookEvent[]>({
    queryKey: ["be-u-webhook-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("be_u_webhook_events").select("*").order("received_at", { ascending: false }).limit(50);
      if (error) throw error;
      return toCamelArray<BeUWebhookEvent>(data || []);
    },
  });

  // ─── Mutations ───────────────────────────────────────────────────────
  const saveCourse = useMutation({
    mutationFn: async () => {
      const payload: any = { ...toSnake(courseForm) };
      // Strip empties on optional CHECK columns
      if (!payload.mode) payload.mode = null;
      if (!payload.tier) payload.tier = null;
      if (!payload.external_url) payload.external_url = null;
      if (!payload.duration_weeks && payload.duration_weeks !== 0) payload.duration_weeks = null;

      if (editingCourse) {
        const { error } = await supabase.from("be_u_courses").update(payload).eq("id", editingCourse.id);
        if (error) throw error;
      } else {
        // Auto-generate course_id if blank
        if (!payload.course_id) {
          const { count } = await supabase.from("be_u_courses").select("id", { count: "exact", head: true });
          payload.course_id = `BEU-X-${String((count || 0) + 1).padStart(3, "0")}`;
        }
        if (!payload.slug) payload.slug = payload.course_id.toLowerCase();
        const { error } = await supabase.from("be_u_courses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["be-u-courses"] });
      setCourseDialog(false);
      setEditingCourse(null);
      setCourseForm({ ...EMPTY_COURSE });
      toast({ title: editingCourse ? "Course updated" : "Course created" });
    },
    onError: (e: any) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("be_u_courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["be-u-courses"] });
      toast({ title: "Course deleted" });
    },
    onError: (e: any) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const manualEnroll = useMutation({
    mutationFn: async () => {
      if (!enrollForm.clientId || !enrollForm.courseId) throw new Error("Pick a client and a course");
      const { count } = await supabase.from("be_u_enrollments").select("id", { count: "exact", head: true });
      const enrollmentId = `BECS-EN-${String((count || 0) + 1).padStart(4, "0")}`;
      const { error } = await supabase.from("be_u_enrollments").insert({
        enrollment_id: enrollmentId,
        client_id: parseInt(enrollForm.clientId, 10),
        course_id: parseInt(enrollForm.courseId, 10),
        status: "enrolled",
        source: "admin_grant",
        started_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["be-u-enrollments"] });
      setEnrollDialog(false);
      setEnrollForm({ clientId: "", courseId: "" });
      toast({ title: "Client enrolled" });
    },
    onError: (e: any) => toast({ title: "Enrollment failed", description: e.message, variant: "destructive" }),
  });

  const updateEnrollment = useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<BeUEnrollment> }) => {
      const { error } = await supabase.from("be_u_enrollments").update(toSnake(patch)).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["be-u-enrollments"] });
    },
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  // ─── Handlers ────────────────────────────────────────────────────────
  const openCreateCourse = () => {
    setEditingCourse(null);
    setCourseForm({ ...EMPTY_COURSE });
    setCourseDialog(true);
  };

  const openEditCourse = (c: BeUCourse) => {
    setEditingCourse(c);
    setCourseForm({
      courseId: c.courseId,
      slug: c.slug,
      title: c.title,
      description: c.description ?? "",
      mode: c.mode ?? "",
      tier: c.tier ?? "foundation",
      priceCents: c.priceCents ?? 0,
      durationWeeks: c.durationWeeks ?? 4,
      externalUrl: c.externalUrl ?? "",
      isPublished: c.isPublished,
    });
    setCourseDialog(true);
  };

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <GraduationCap className="text-primary" size={24} />
          <div>
            <h1 className="text-2xl font-bold">BE University</h1>
            <p className="text-xs text-muted-foreground">Course catalog, client enrollments, and platform sync log</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEnrollDialog(true)} data-testid="button-manual-enroll">
            <UserPlus size={14} className="mr-1" /> Manual enroll
          </Button>
          <Button size="sm" onClick={openCreateCourse} data-testid="button-new-course">
            <Plus size={14} className="mr-1" /> New course
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="courses" data-testid="tab-courses">Courses ({courses.length})</TabsTrigger>
          <TabsTrigger value="enrollments" data-testid="tab-enrollments">Enrollments ({enrollments.length})</TabsTrigger>
          <TabsTrigger value="webhooks" data-testid="tab-webhooks">Sync log ({events.length})</TabsTrigger>
        </TabsList>

        {/* COURSES */}
        <TabsContent value="courses" className="mt-4">
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {courses.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No courses yet. Click "New course".</div>
              ) : (
                courses.map((c) => (
                  <div key={c.id} className="p-4 hover:bg-muted/30 transition-colors" data-testid={`course-row-${c.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs text-muted-foreground">{c.courseId}</span>
                          <h3 className="font-semibold text-sm">{c.title}</h3>
                          {c.mode && <Badge className={`text-xs ${MODE_BADGE[c.mode]}`}>{label(c.mode)}</Badge>}
                          {c.tier && <Badge variant="outline" className="text-xs">{label(c.tier)}</Badge>}
                          {!c.isPublished && <Badge variant="outline" className="text-xs">Draft</Badge>}
                        </div>
                        {c.description && <p className="text-xs text-muted-foreground mb-1">{c.description}</p>}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{priceDollars(c.priceCents)}</span>
                          {c.durationWeeks && <span>· {c.durationWeeks} weeks</span>}
                          {c.externalUrl && (
                            <a href={c.externalUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                              <ExternalLink size={10} /> External
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditCourse(c)} data-testid={`button-edit-course-${c.id}`}>
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          onClick={() => {
                            if (confirm(`Delete "${c.title}"? This will fail if any enrollments reference it.`)) {
                              deleteCourse.mutate(c.id);
                            }
                          }}
                          data-testid={`button-delete-course-${c.id}`}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ENROLLMENTS */}
        <TabsContent value="enrollments" className="mt-4">
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {enrollments.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No enrollments yet. Click "Manual enroll" to add one, or close a proposal — clients are auto-enrolled in their mode's foundation course.
                </div>
              ) : (
                enrollments.map((e) => (
                  <div key={e.id} className="p-4 hover:bg-muted/30 transition-colors" data-testid={`enrollment-row-${e.id}`}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs text-muted-foreground">{e.enrollmentId}</span>
                          <span className="font-semibold text-sm">{e.clientName ?? `Client #${e.clientId}`}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-sm">{e.courseTitle ?? `Course #${e.courseId}`}</span>
                          {e.courseMode && <Badge className={`text-xs ${MODE_BADGE[e.courseMode]}`}>{label(e.courseMode)}</Badge>}
                          <Badge className={`text-xs ${STATUS_BADGE[e.status]}`}>{label(e.status)}</Badge>
                          <Badge variant="outline" className="text-xs">{label(e.source)}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all" style={{ width: `${e.progressPct}%` }} />
                          </div>
                          <span className="text-xs font-mono text-muted-foreground">{e.progressPct}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={e.status}
                          onValueChange={(v) => updateEnrollment.mutate({ id: e.id, patch: { status: v as any, completedAt: v === "completed" ? new Date().toISOString() : null } })}
                        >
                          <SelectTrigger className="h-7 w-32 text-xs" data-testid={`select-enrollment-status-${e.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={e.progressPct}
                          onChange={(ev) => updateEnrollment.mutate({ id: e.id, patch: { progressPct: parseInt(ev.target.value || "0", 10) } })}
                          className="h-7 w-16 text-xs"
                          data-testid={`input-enrollment-progress-${e.id}`}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* WEBHOOK / SYNC LOG */}
        <TabsContent value="webhooks" className="mt-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Webhook size={14} /> Sync log
                <span className="text-xs font-normal text-muted-foreground">(latest 50)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border">
              {events.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No sync events yet. Inbound events arrive when BE U platform fires webhooks; outbound events log when this OS provisions enrollments.
                </div>
              ) : (
                events.map((ev) => (
                  <div key={ev.id} className="p-3" data-testid={`event-row-${ev.id}`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs font-mono">{ev.direction}</Badge>
                      <span className="text-xs font-mono text-muted-foreground">{ev.source}</span>
                      <span className="text-sm font-medium">{ev.eventType}</span>
                      <Badge className={`text-xs ${STATUS_BADGE[ev.status] ?? "bg-slate-100 text-slate-700"}`}>{label(ev.status)}</Badge>
                      <span className="text-xs text-muted-foreground ml-auto">{new Date(ev.receivedAt).toLocaleString()}</span>
                    </div>
                    {ev.errorMessage && <p className="text-xs text-destructive mt-1">{ev.errorMessage}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* COURSE DIALOG */}
      <Dialog open={courseDialog} onOpenChange={setCourseDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingCourse ? "Edit course" : "New course"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Course ID</Label>
                <Input value={courseForm.courseId} onChange={(e) => setCourseForm({ ...courseForm, courseId: e.target.value })} placeholder="auto: BEU-X-NNN" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Slug</Label>
                <Input value={courseForm.slug} onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value })} placeholder="auto from id" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Title *</Label>
              <Input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea rows={2} value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Mode</Label>
                <Select value={courseForm.mode} onValueChange={(v) => setCourseForm({ ...courseForm, mode: v })}>
                  <SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger>
                  <SelectContent>{MODE_OPTIONS.map((m) => <SelectItem key={m} value={m}>{label(m)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tier</Label>
                <Select value={courseForm.tier} onValueChange={(v) => setCourseForm({ ...courseForm, tier: v })}>
                  <SelectTrigger><SelectValue placeholder="Tier" /></SelectTrigger>
                  <SelectContent>{TIER_OPTIONS.map((t) => <SelectItem key={t} value={t}>{label(t)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duration (wks)</Label>
                <Input type="number" value={courseForm.durationWeeks} onChange={(e) => setCourseForm({ ...courseForm, durationWeeks: parseInt(e.target.value || "0", 10) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Price (USD)</Label>
                <Input
                  type="number" step="0.01"
                  value={(courseForm.priceCents / 100).toString()}
                  onChange={(e) => setCourseForm({ ...courseForm, priceCents: Math.round(parseFloat(e.target.value || "0") * 100) })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">External URL (BE U platform)</Label>
                <Input value={courseForm.externalUrl} onChange={(e) => setCourseForm({ ...courseForm, externalUrl: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={courseForm.isPublished} onChange={(e) => setCourseForm({ ...courseForm, isPublished: e.target.checked })} />
              Published (visible to enrolled clients)
            </label>
            <Button onClick={() => saveCourse.mutate()} disabled={saveCourse.isPending || !courseForm.title} className="w-full" data-testid="button-save-course">
              {saveCourse.isPending ? "Saving…" : editingCourse ? "Update course" : "Create course"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MANUAL ENROLL DIALOG */}
      <Dialog open={enrollDialog} onOpenChange={setEnrollDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Manual enroll</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Client</Label>
              <Select value={enrollForm.clientId} onValueChange={(v) => setEnrollForm({ ...enrollForm, clientId: v })}>
                <SelectTrigger data-testid="select-enroll-client"><SelectValue placeholder="Pick a client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name} {c.businessName ? `· ${c.businessName}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Course</Label>
              <Select value={enrollForm.courseId} onValueChange={(v) => setEnrollForm({ ...enrollForm, courseId: v })}>
                <SelectTrigger data-testid="select-enroll-course"><SelectValue placeholder="Pick a course" /></SelectTrigger>
                <SelectContent>
                  {courses.filter((c) => c.isPublished).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.title} {c.mode ? `· ${label(c.mode)}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => manualEnroll.mutate()} disabled={manualEnroll.isPending || !enrollForm.clientId || !enrollForm.courseId} className="w-full" data-testid="button-confirm-enroll">
              {manualEnroll.isPending ? "Enrolling…" : "Enroll client"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
