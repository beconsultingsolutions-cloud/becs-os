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
import type { Lead, Meeting } from "@shared/schema";
import { Plus, Search, Filter, Mail, Building2, ChevronDown, ChevronUp } from "lucide-react";

const STATUSES = ["new","reviewing","discovery","assessment","proposal","nurture","not_fit"];
const SERVICE_OPTIONS = ["reality_check","foundation_builder","business_launch","strategy_ops_session","accelerator","brand_identity","gtm_launch","compliance_coaching","retainer","add_on"];
const STAGE_OPTIONS = ["startup","growing","established"];
const BUDGET_OPTIONS = ["low","mid","high"];
const SOURCE_OPTIONS = ["website","referral","linkedin","speaking","direct","qr_code","email","returning"];
const PATH_OPTIONS = ["path_a","path_b","path_c","path_d"];

function label(s: string) { return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

function LeadForm({ onSuccess, initial }: { onSuccess: () => void; initial?: Partial<Lead> }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { currentEntity } = useEntity();
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
  });

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (initial?.id) {
        const { error } = await supabase.from("leads").update({ ...toSnake(form), updated_at: new Date().toISOString() }).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { count } = await supabase.from("leads").select("id", { count: "exact", head: true });
        const leadId = `BECS-L-${String((count || 0) + 1).padStart(3, "0")}`;
        const { data, error } = await supabase.from("leads").insert({ ...toSnake(form), lead_id: leadId, entity_id: currentEntity }).select().single();
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
          <Label className="text-xs">Email *</Label>
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
      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !form.name || !form.email}
        className="w-full"
        data-testid="button-save-lead"
      >
        {mutation.isPending ? "Saving…" : initial?.id ? "Update Lead" : "Create Lead"}
      </Button>
    </div>
  );
}

function LeadDetailPanel({ lead, consultBooked }: { lead: Lead; consultBooked: boolean }) {
  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3">
      {consultBooked && (
        <Badge className="text-xs bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
          Consult booked
        </Badge>
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
        <div className="flex items-center gap-2">
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
                        return (
                          <div key={lead.id} className="px-5 py-3 hover:bg-muted/30 transition-colors" data-testid={`lead-item-${lead.id}`}>
                            <div className="flex items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
                                  {lead.serviceInterest && (
                                    <Badge variant="outline" className="text-xs shrink-0">{label(lead.serviceInterest)}</Badge>
                                  )}
                                  {hasConsult && (
                                    <Badge className="text-xs shrink-0 bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                                      Consult booked
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                  {lead.businessName && <span className="text-xs text-muted-foreground flex items-center gap-1"><Building2 size={10} />{lead.businessName}</span>}
                                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail size={10} />{lead.email}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {lead.budgetComfort && <span className="text-xs text-muted-foreground capitalize">{lead.budgetComfort} budget</span>}
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
