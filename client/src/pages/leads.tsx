import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, toSnake, toCamelArray, toCamel } from "@/lib/supabase";
import { useEntity } from "@/lib/entity-context";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { Plus, Search, Filter, ChevronDown, Mail, Phone, Building2, Tag, Sparkles, MapPin, Linkedin, Globe, Loader2 } from "lucide-react";

const STATUSES = ["prospect","new","reviewing","discovery","assessment","proposal","nurture","not_fit"];
const SERVICE_OPTIONS = ["reality_check","foundation_builder","business_launch","retainer","add_on"];
const STAGE_OPTIONS = ["startup","growing","established"];
const BUDGET_OPTIONS = ["low","mid","high"];
const SOURCE_OPTIONS = ["website","referral","linkedin","speaking","direct","qr_code","email","returning"];
const PATH_OPTIONS = ["path_a","path_b","path_c","path_d"];

const SUPABASE_URL = "https://eorkllalnzottuhejdrl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvcmtsbGFsbnpvdHR1aGVqZHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMDQ5ODMsImV4cCI6MjA5MTg4MDk4M30.PTVfi6PNOMZQOinpLtYfDnTBMMrqCweFiWMBYZzxwDs";

function label(s: string) { return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

// ─── Research Prospects Dialog ────────────────────────────────────────────────

function ResearchProspectsDialog({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { currentEntity } = useEntity();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    industry: "",
    location: "",
    business_stage: "",
    service_to_pitch: "",
    count: 15,
    additional_notes: "",
  });

  const update = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const handleResearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/research-prospects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ ...form, entity_id: currentEntity }),
      });
      const result = await res.json();

      if (res.status === 503 && result.error === "PERPLEXITY_API_KEY not configured") {
        toast({
          title: "Perplexity API key not configured",
          description: "Add Perplexity API key to Supabase to enable this feature.",
          variant: "destructive",
        });
        return;
      }

      if (!res.ok) {
        toast({
          title: "Research failed",
          description: result.message || "An unexpected error occurred.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Prospects researched!",
        description: `${result.inserted_count} new prospects added, ${result.skipped_count} skipped`,
      });
      qc.invalidateQueries({ queryKey: ["leads"] });
      setOpen(false);
      onSuccess();
    } catch (err) {
      toast({
        title: "Error",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" data-testid="button-research-prospects">
          <Sparkles size={14} className="mr-1" /> Research Prospects
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={16} className="text-green-500" /> AI Prospect Research
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Industry</Label>
              <Input
                value={form.industry}
                onChange={(e) => update("industry", e.target.value)}
                placeholder="e.g. wellness studios"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Location</Label>
              <Input
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="e.g. Atlanta, GA"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Business Stage</Label>
              <Select value={form.business_stage} onValueChange={(v) => update("business_stage", v)}>
                <SelectTrigger><SelectValue placeholder="Any stage" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="growing">Growing</SelectItem>
                  <SelectItem value="established">Established</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Service to Pitch</Label>
              <Select value={form.service_to_pitch} onValueChange={(v) => update("service_to_pitch", v)}>
                <SelectTrigger><SelectValue placeholder="Any service" /></SelectTrigger>
                <SelectContent>
                  {SERVICE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{label(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Number of Prospects</Label>
            <Input
              type="number"
              min={5}
              max={25}
              value={form.count}
              onChange={(e) => update("count", parseInt(e.target.value, 10) || 15)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Additional Notes (optional)</Label>
            <Textarea
              rows={2}
              value={form.additional_notes}
              onChange={(e) => update("additional_notes", e.target.value)}
              placeholder="Any extra context to help target the right prospects..."
            />
          </div>
          <Button
            onClick={handleResearch}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Researching prospects... (this can take 30-60 seconds)
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles size={14} /> Research
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Lead Form ────────────────────────────────────────────────────────────────

function LeadForm({ onSuccess, initial }: { onSuccess: () => void; initial?: Partial<Lead> }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { currentEntity } = useEntity();
  const [showProspectFields, setShowProspectFields] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    businessName: initial?.businessName ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    businessStage: initial?.businessStage ?? "",
    serviceInterest: initial?.serviceInterest ?? "",
    goals: initial?.goals ?? "",
    painPoints: initial?.painPoints ?? "",
    timeline: initial?.timeline ?? "",
    budgetComfort: initial?.budgetComfort ?? "",
    referralSource: initial?.referralSource ?? "",
    status: initial?.status ?? "new",
    qualificationNotes: initial?.qualificationNotes ?? "",
    recommendedPath: initial?.recommendedPath ?? "",
    nextStep: initial?.nextStep ?? "",
    // Prospect fields
    linkedinUrl: initial?.linkedinUrl ?? "",
    location: initial?.location ?? "",
    fitScore: initial?.fitScore != null ? String(initial.fitScore) : "",
    priority: initial?.priority ?? "",
    website: initial?.website ?? "",
    industry: initial?.industry ?? "",
    fitReasoning: initial?.fitReasoning ?? "",
  });

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        name: form.name,
        business_name: form.businessName || null,
        email: form.email || null,
        phone: form.phone || null,
        business_stage: form.businessStage || null,
        service_interest: form.serviceInterest || null,
        goals: form.goals || null,
        pain_points: form.painPoints || null,
        timeline: form.timeline || null,
        budget_comfort: form.budgetComfort || null,
        referral_source: form.referralSource || null,
        status: form.status,
        qualification_notes: form.qualificationNotes || null,
        recommended_path: form.recommendedPath || null,
        next_step: form.nextStep || null,
        linkedin_url: form.linkedinUrl || null,
        location: form.location || null,
        fit_score: form.fitScore ? parseFloat(form.fitScore) : null,
        priority: form.priority || null,
        website: form.website || null,
        industry: form.industry || null,
        fit_reasoning: form.fitReasoning || null,
      };

      if (initial?.id) {
        const { error } = await supabase.from("leads").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { count } = await supabase.from("leads").select("id", { count: "exact", head: true });
        const leadId = `BECS-L-${String((count || 0) + 1).padStart(3, "0")}`;
        const { data, error } = await supabase.from("leads").insert({ ...payload, lead_id: leadId, entity_id: currentEntity }).select().single();
        if (error) throw error;
        await supabase.from("automation_events").insert({
          type: "lead_created", entity_type: "lead", record_id: data.id,
          description: `Lead ${leadId} created`, status: "success",
          triggered_at: new Date().toISOString(), entity_id: currentEntity,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["automation-events"] });
      toast({ title: initial?.id ? "Lead updated" : "Lead created" });
      onSuccess();
    },
    onError: () => toast({ title: "Error saving lead", variant: "destructive" }),
  });

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Full Name *</Label>
          <Input value={form.name} onChange={(e) => update("name", e.target.value)} data-testid="input-lead-name" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Business Name</Label>
          <Input value={form.businessName} onChange={(e) => update("businessName", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Email</Label>
          <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Phone</Label>
          <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Business Stage</Label>
          <Select value={form.businessStage} onValueChange={(v) => update("businessStage", v)}>
            <SelectTrigger><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>{STAGE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Service Interest</Label>
          <Select value={form.serviceInterest} onValueChange={(v) => update("serviceInterest", v)}>
            <SelectTrigger><SelectValue placeholder="Service" /></SelectTrigger>
            <SelectContent>{SERVICE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Budget Comfort</Label>
          <Select value={form.budgetComfort} onValueChange={(v) => update("budgetComfort", v)}>
            <SelectTrigger><SelectValue placeholder="Budget" /></SelectTrigger>
            <SelectContent>{BUDGET_OPTIONS.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={(v) => update("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Referral Source</Label>
          <Select value={form.referralSource} onValueChange={(v) => update("referralSource", v)}>
            <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>{SOURCE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Goals</Label>
        <Textarea rows={2} value={form.goals} onChange={(e) => update("goals", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Pain Points</Label>
        <Textarea rows={2} value={form.painPoints} onChange={(e) => update("painPoints", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Timeline</Label>
          <Input value={form.timeline} onChange={(e) => update("timeline", e.target.value)} placeholder="e.g. 60 days" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Recommended Path</Label>
          <Select value={form.recommendedPath} onValueChange={(v) => update("recommendedPath", v)}>
            <SelectTrigger><SelectValue placeholder="Path" /></SelectTrigger>
            <SelectContent>{PATH_OPTIONS.map((p) => <SelectItem key={p} value={p}>{label(p)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Qualification Notes</Label>
        <Textarea rows={2} value={form.qualificationNotes} onChange={(e) => update("qualificationNotes", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Next Step</Label>
        <Input value={form.nextStep} onChange={(e) => update("nextStep", e.target.value)} />
      </div>

      {/* Collapsible Prospecting Info */}
      <div className="border rounded-md overflow-hidden">
        <button
          type="button"
          onClick={() => setShowProspectFields((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/40 hover:bg-muted/60 transition-colors"
        >
          <span className="flex items-center gap-1.5"><Sparkles size={12} /> Prospecting Info</span>
          <ChevronDown size={13} className={`transition-transform ${showProspectFields ? "rotate-180" : ""}`} />
        </button>
        {showProspectFields && (
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Website</Label>
                <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">LinkedIn URL</Label>
                <Input value={form.linkedinUrl} onChange={(e) => update("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Location</Label>
                <Input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="City, State" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Industry</Label>
                <Input value={form.industry} onChange={(e) => update("industry", e.target.value)} placeholder="e.g. wellness studios" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fit Score (1–10)</Label>
                <Input type="number" min={1} max={10} value={form.fitScore} onChange={(e) => update("fitScore", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Priority</Label>
                <Select value={form.priority} onValueChange={(v) => update("priority", v)}>
                  <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fit Reasoning</Label>
              <Textarea rows={2} value={form.fitReasoning} onChange={(e) => update("fitReasoning", e.target.value)} placeholder="Why this prospect is a good fit for BECS..." />
            </div>
          </div>
        )}
      </div>

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !form.name}
        className="w-full"
        data-testid="button-save-lead"
      >
        {mutation.isPending ? "Saving…" : initial?.id ? "Update Lead" : "Create Lead"}
      </Button>
    </div>
  );
}

// ─── Fit Score Badge ──────────────────────────────────────────────────────────

function FitScoreBadge({ score }: { score: number }) {
  const colorClass =
    score >= 8 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
    score >= 5 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${colorClass}`}>
      Fit: {score}/10
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colorClass =
    priority === "high" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
    priority === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize ${colorClass}`}>
      {priority}
    </span>
  );
}

// ─── Leads Page ───────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const { currentEntity } = useEntity();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["leads", currentEntity],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("*").eq("entity_id", currentEntity).order("created_at", { ascending: false });
      return toCamelArray<Lead>(data || []);
    },
  });

  const filtered = leads.filter((l) => {
    const matchSearch = search === "" || [l.name, l.businessName, l.email].some((v) => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const grouped: Record<string, Lead[]> = {};
  for (const s of STATUSES) grouped[s] = filtered.filter((l) => l.status === s);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Lead Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{leads.length} total leads</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8 w-48 text-sm h-9"
              placeholder="Search leads…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-leads"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-36 text-sm">
              <Filter size={13} className="mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}
            </SelectContent>
          </Select>
          <ResearchProspectsDialog onSuccess={() => {}} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-lead">
                <Plus size={14} className="mr-1" /> Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>New Lead</DialogTitle></DialogHeader>
              <LeadForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-16 w-full" />)}</div>
      ) : (
        <div className="space-y-3">
          {STATUSES.map((status) => {
            const group = grouped[status];
            if (group.length === 0 && statusFilter !== "all") return null;
            return (
              <Card key={status}>
                <CardHeader className="py-3 px-5 flex flex-row items-center gap-2">
                  <span className={`status-${status} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>{label(status)}</span>
                  <span className="text-xs text-muted-foreground">{group.length} lead{group.length !== 1 ? "s" : ""}</span>
                </CardHeader>
                {group.length > 0 && (
                  <CardContent className="p-0 pb-1">
                    <div className="divide-y divide-border">
                      {group.map((lead) => (
                        <div key={lead.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors" data-testid={`lead-item-${lead.id}`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
                              {lead.serviceInterest && (
                                <Badge variant="outline" className="text-xs shrink-0">{label(lead.serviceInterest)}</Badge>
                              )}
                              {/* Prospect-specific badges */}
                              {lead.status === "prospect" && lead.fitScore != null && (
                                <FitScoreBadge score={lead.fitScore} />
                              )}
                              {lead.status === "prospect" && lead.priority && (
                                <PriorityBadge priority={lead.priority} />
                              )}
                            </div>
                            {/* Fit reasoning for prospects */}
                            {lead.status === "prospect" && lead.fitReasoning && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-lg">{lead.fitReasoning}</p>
                            )}
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              {lead.businessName && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Building2 size={10} />{lead.businessName}
                                </span>
                              )}
                              {lead.email && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Mail size={10} />{lead.email}
                                </span>
                              )}
                              {/* Location for prospects */}
                              {lead.location && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin size={10} />{lead.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {lead.budgetComfort && <span className="text-xs text-muted-foreground capitalize">{lead.budgetComfort} budget</span>}
                            {lead.referralSource && <span className="text-xs text-muted-foreground capitalize hidden sm:block">{label(lead.referralSource)}</span>}
                            {/* Prospect link icons */}
                            {lead.linkedinUrl && (
                              <a
                                href={lead.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-blue-600 transition-colors"
                                title="LinkedIn"
                              >
                                <Linkedin size={14} />
                              </a>
                            )}
                            {lead.website && (
                              <a
                                href={lead.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                title="Website"
                              >
                                <Globe size={14} />
                              </a>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => { setEditing(lead); setOpen(true); }}
                              data-testid={`button-edit-lead-${lead.id}`}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Edit Lead — {editing?.name}</DialogTitle></DialogHeader>
          {editing && <LeadForm onSuccess={() => setEditing(null)} initial={editing} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
