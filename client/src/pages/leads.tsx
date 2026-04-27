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
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import type { Lead, Meeting } from "@shared/schema";
import { Plus, Search, Filter, Mail, Phone, Building2, ChevronDown, ChevronUp, Target, Sparkles, MapPin, Linkedin, Globe, Loader2, Tag } from "lucide-react";

const STATUSES = ["prospect","new","reviewing","discovery","assessment","proposal","nurture","not_fit"];
const SERVICE_OPTIONS = ["reality_check","foundation_builder","business_launch","strategy_ops_session","accelerator","brand_identity","gtm_launch","compliance_coaching","retainer","add_on"];
const STAGE_OPTIONS = ["startup","growing","established"];
const BUDGET_OPTIONS = ["low","mid","high"];
const SOURCE_OPTIONS = ["website","referral","linkedin","speaking","direct","qr_code","email","returning"];
const PATH_OPTIONS = ["path_a","path_b","path_c","path_d"];
const MODE_OPTIONS = ["plan","evolve","succeed"];
const MODE_BLURB: Record<string, string> = {
  plan: "Foundation & clarity. $3K-$15K. Brand, messaging, pricing.",
  evolve: "Optimize & scale systems. $10K-$18K. Website, marketing, ops.",
  succeed: "Authority & passive income. $12K-$25K+. Products, public figure, advanced ops.",
};
const MODE_BADGE: Record<string, string> = {
  plan:    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  evolve:  "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  succeed: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
};

// Auto-suggest mode from business_stage + budget hints
function suggestMode(stage: string, budget: string): string {
  if (stage === "established") return "succeed";
  if (stage === "growing")     return "evolve";
  if (stage === "startup")     return "plan";
  if (budget === "high")       return "succeed";
  if (budget === "mid")        return "evolve";
  if (budget === "low")        return "plan";
  return "";
}

function scoreBadgeColor(score: number): string {
  if (score >= 75) return "bg-green-600 text-white border-green-700";
  if (score >= 50) return "bg-amber-500 text-white border-amber-600";
  if (score >= 25) return "bg-slate-400 text-white border-slate-500";
  return "bg-slate-200 text-slate-600 border-slate-300";
}

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
    mode: initial?.mode ?? "",
    scoreBudget:    initial?.scoreBudget    ?? 0,
    scoreAuthority: initial?.scoreAuthority ?? 0,
    scoreNeed:      initial?.scoreNeed      ?? 0,
    scoreTimeline:  initial?.scoreTimeline  ?? 0,
    scoreFit:       initial?.scoreFit       ?? 0,
    // Prospect fields
    linkedinUrl: initial?.linkedinUrl ?? "",
    location: initial?.location ?? "",
    fitScore: initial?.fitScore != null ? String(initial.fitScore) : "",
    priority: initial?.priority ?? "",
    website: initial?.website ?? "",
    industry: initial?.industry ?? "",
    fitReasoning: initial?.fitReasoning ?? "",
  });

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const totalScore = form.scoreBudget + form.scoreAuthority + form.scoreNeed + form.scoreTimeline + form.scoreFit;
  const suggested = suggestMode(form.businessStage, form.budgetComfort);

  const mutation = useMutation({
    mutationFn: async (payload: any = form) => {
      if (initial?.id) {
        const { error } = await supabase.from("leads").update({ ...toSnake(payload), updated_at: new Date().toISOString() }).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { count } = await supabase.from("leads").select("id", { count: "exact", head: true });
        const leadId = `BECS-L-${String((count || 0) + 1).padStart(3, "0")}`;
        const { data, error } = await supabase.from("leads").insert({ ...toSnake(payload), lead_id: leadId, entity_id: currentEntity }).select().single();
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
      <div className="grid grid-cols-3 gap-3">
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
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            BECS Mode
            {suggested && form.mode !== suggested && (
              <button
                type="button"
                onClick={() => update("mode", suggested)}
                className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                data-testid="button-apply-suggested-mode"
              >
                <Sparkles size={10} /> Use {label(suggested)}
              </button>
            )}
          </Label>
          <Select value={form.mode} onValueChange={(v) => update("mode", v)}>
            <SelectTrigger data-testid="select-mode"><SelectValue placeholder="Mode" /></SelectTrigger>
            <SelectContent>{MODE_OPTIONS.map((m) => <SelectItem key={m} value={m}>{label(m)}</SelectItem>)}</SelectContent>
          </Select>
          {form.mode && (
            <p className="text-[10px] text-muted-foreground leading-tight">{MODE_BLURB[form.mode]}</p>
          )}
        </div>
      </div>

      {/* BECS Qualifier - BANTF score */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-primary" />
            <Label className="text-xs font-semibold">BECS Qualifier Score</Label>
          </div>
          <Badge className={`text-xs ${scoreBadgeColor(totalScore)}`} data-testid="badge-total-score">
            {totalScore}/100
          </Badge>
        </div>
        {[
          { key: "scoreBudget",    name: "Budget Match",  max: 25, hint: "Can afford services" },
          { key: "scoreAuthority", name: "Authority",     max: 20, hint: "Decision maker" },
          { key: "scoreNeed",      name: "Need",          max: 25, hint: "Clear pain point" },
          { key: "scoreTimeline",  name: "Timeline",      max: 15, hint: "Ready within 90 days" },
          { key: "scoreFit",       name: "Fit",           max: 15, hint: "Matches ideal client" },
        ].map(({ key, name, max, hint }) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{name} <span className="text-muted-foreground font-normal">· {hint}</span></span>
              <span className="text-xs font-mono">{(form as any)[key]}/{max}</span>
            </div>
            <Slider
              value={[(form as any)[key]]}
              max={max}
              step={1}
              onValueChange={([v]) => update(key, v)}
              data-testid={`slider-${key}`}
            />
          </div>
        ))}
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
        onClick={() => {
          // Strip empty mode so CHECK constraint passes; never send leadScore (it's GENERATED)
          // Convert fitScore string -> number for DB; empty -> null
          const payload: any = { ...form };
          if (!payload.mode) payload.mode = null;
          if (!payload.priority) payload.priority = null;
          payload.fitScore = payload.fitScore !== "" && payload.fitScore != null ? parseFloat(payload.fitScore) : null;
          delete payload.leadScore;
          mutation.mutate(payload);
        }}
        disabled={mutation.isPending || !form.name}
        className="w-full"
        data-testid="button-save-lead"
      >
        {mutation.isPending ? "Saving…" : initial?.id ? "Update Lead" : "Create Lead"}
      </Button>
    </div>
  );
}

// ─── Fit Score / Priority Badges (Prospects) ──────────────────────────────────

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

// ─── Lead Detail Panel ────────────────────────────────────────────────────────

function LeadDetailPanel({ lead, consultBooked }: { lead: Lead; consultBooked: boolean }) {
  const scoreRows: Array<[string, number, number]> = [
    ["Budget Match",  lead.scoreBudget    ?? 0, 25],
    ["Authority",     lead.scoreAuthority ?? 0, 20],
    ["Need",          lead.scoreNeed      ?? 0, 25],
    ["Timeline",      lead.scoreTimeline  ?? 0, 15],
    ["Fit",           lead.scoreFit       ?? 0, 15],
  ];
  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3">
      {consultBooked && (
        <Badge className="text-xs bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
          Consult booked
        </Badge>
      )}
      {(lead.leadScore ?? 0) > 0 && (
        <div className="rounded-md bg-muted/30 px-3 py-2 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold flex items-center gap-1"><Target size={11} /> BECS Qualifier</span>
            <Badge className={`text-xs ${scoreBadgeColor(lead.leadScore ?? 0)}`}>{lead.leadScore}/100</Badge>
          </div>
          <div className="grid grid-cols-5 gap-1 text-[10px]">
            {scoreRows.map(([n, v, m]) => (
              <div key={n} className="text-center">
                <p className="text-muted-foreground truncate">{n}</p>
                <p className="font-mono font-medium">{v}/{m}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
        {lead.businessStage && (
          <div>
            <span className="text-muted-foreground">Stage: </span>
            <span className="font-medium">{label(lead.businessStage)}</span>
          </div>
        )}
        {lead.timeline && (
          <div>
            <span className="text-muted-foreground">Timeline: </span>
            <span className="font-medium">{lead.timeline}</span>
          </div>
        )}
        {lead.budgetComfort && (
          <div>
            <span className="text-muted-foreground">Budget: </span>
            <span className="font-medium capitalize">{lead.budgetComfort}</span>
          </div>
        )}
        {lead.referralSource && (
          <div>
            <span className="text-muted-foreground">Source: </span>
            <span className="font-medium">{label(lead.referralSource)}</span>
          </div>
        )}
      </div>
      {lead.goals && (
        <div className="text-xs">
          <p className="text-muted-foreground font-medium mb-0.5">Goals</p>
          <p className="text-foreground leading-relaxed">{lead.goals}</p>
        </div>
      )}
      {lead.painPoints && (
        <div className="text-xs">
          <p className="text-muted-foreground font-medium mb-0.5">Pain Points</p>
          <p className="text-foreground leading-relaxed">{lead.painPoints}</p>
        </div>
      )}
      {lead.qualificationNotes && (
        <div className="text-xs">
          <p className="text-muted-foreground font-medium mb-0.5">Qualification Notes</p>
          <p className="text-foreground leading-relaxed">{lead.qualificationNotes}</p>
        </div>
      )}
      {lead.nextStep && (
        <div className="text-xs">
          <p className="text-muted-foreground font-medium mb-0.5">Next Step</p>
          <p className="text-foreground">{lead.nextStep}</p>
        </div>
      )}
    </div>
  );
}

export default function LeadsPage() {
  const { currentEntity } = useEntity();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [expandedLeadId, setExpandedLeadId] = useState<number | null>(null);

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["leads", currentEntity],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("*").eq("entity_id", currentEntity).order("created_at", { ascending: false });
      return toCamelArray<Lead>(data || []);
    },
  });

  // Load consult meetings to show "Consult booked" badge
  const leadIdList = leads.map((l) => l.id);
  const { data: consultMeetings = [] } = useQuery<Meeting[]>({
    queryKey: ["consult-meetings-for-leads", currentEntity],
    queryFn: async () => {
      if (leadIdList.length === 0) return [];
      const { data } = await supabase
        .from("meetings")
        .select("id,lead_id")
        .eq("type", "consult")
        .in("lead_id", leadIdList);
      return toCamelArray<Meeting>(data || []);
    },
    enabled: leadIdList.length > 0,
  });

  const consultBookedSet = new Set(consultMeetings.map((m) => m.leadId).filter(Boolean) as number[]);

  const filtered = leads.filter((l) => {
    const matchSearch = search === "" || [l.name, l.businessName, l.email].some((v) => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchMode   = modeFilter === "all" || l.mode === modeFilter;
    return matchSearch && matchStatus && matchMode;
  });

  // Sort by lead_score DESC within each status (highest priority first)
  const grouped: Record<string, Lead[]> = {};
  for (const s of STATUSES) {
    grouped[s] = filtered
      .filter((l) => l.status === s)
      .sort((a, b) => (b.leadScore ?? 0) - (a.leadScore ?? 0));
  }

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
          <Select value={modeFilter} onValueChange={setModeFilter}>
            <SelectTrigger className="h-9 w-32 text-sm" data-testid="select-mode-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              {MODE_OPTIONS.map((m) => <SelectItem key={m} value={m}>{label(m)}</SelectItem>)}
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
                      {group.map((lead) => {
                        const isExpanded = expandedLeadId === lead.id;
                        const hasConsult = consultBookedSet.has(lead.id);
                        const isProspect = lead.status === "prospect";
                        return (
                          <div key={lead.id} className="px-5 py-3 hover:bg-muted/30 transition-colors" data-testid={`lead-item-${lead.id}`}>
                            <div className="flex items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
                                  {lead.mode && (
                                    <Badge className={`text-xs shrink-0 ${MODE_BADGE[lead.mode] ?? ""}`} data-testid={`badge-mode-${lead.id}`}>
                                      {label(lead.mode)}
                                    </Badge>
                                  )}
                                  {(lead.leadScore ?? 0) > 0 && (
                                    <Badge className={`text-xs shrink-0 ${scoreBadgeColor(lead.leadScore ?? 0)}`} data-testid={`badge-score-${lead.id}`}>
                                      {lead.leadScore}/100
                                    </Badge>
                                  )}
                                  {lead.serviceInterest && (
                                    <Badge variant="outline" className="text-xs shrink-0">{label(lead.serviceInterest)}</Badge>
                                  )}
                                  {/* Prospect-specific badges */}
                                  {isProspect && lead.fitScore != null && (
                                    <FitScoreBadge score={lead.fitScore} />
                                  )}
                                  {isProspect && lead.priority && (
                                    <PriorityBadge priority={lead.priority} />
                                  )}
                                  {hasConsult && (
                                    <Badge className="text-xs shrink-0 bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                                      Consult booked
                                    </Badge>
                                  )}
                                </div>
                                {/* Fit reasoning for prospects */}
                                {isProspect && lead.fitReasoning && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-lg">{lead.fitReasoning}</p>
                                )}
                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                  {lead.businessName && <span className="text-xs text-muted-foreground flex items-center gap-1"><Building2 size={10} />{lead.businessName}</span>}
                                  {lead.email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail size={10} />{lead.email}</span>}
                                  {lead.location && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin size={10} />{lead.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {lead.budgetComfort && <span className="text-xs text-muted-foreground capitalize">{lead.budgetComfort} budget</span>}
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
                                  className="h-7 w-7 p-0"
                                  onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                                  data-testid={`button-expand-lead-${lead.id}`}
                                  title={isExpanded ? "Collapse" : "Expand details"}
                                >
                                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </Button>
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
                            {isExpanded && <LeadDetailPanel lead={lead} consultBooked={hasConsult} />}
                          </div>
                        );
                      })}
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
