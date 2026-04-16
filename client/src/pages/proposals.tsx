import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, toSnake, toCamelArray } from "@/lib/supabase";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Proposal, Lead } from "@shared/schema";
import { FileText, Plus, DollarSign, Clock, CheckCircle2, Send, Eye } from "lucide-react";

function label(s: string) { return (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

const SERVICE_OPTIONS = ["reality_check","foundation_builder","business_launch","retainer","add_on"];
const STATUS_OPTIONS = ["draft","sent","viewed","accepted","declined","expired"];

const statusIcons: Record<string, any> = {
  draft: FileText, sent: Send, viewed: Eye, accepted: CheckCircle2, declined: FileText, expired: Clock,
};

export default function ProposalsPage() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: proposals = [], isLoading } = useQuery<Proposal[]>({
    queryKey: ["proposals"],
    queryFn: async () => {
      const { data } = await supabase.from("proposals").select("*").order("created_at", { ascending: false });
      return toCamelArray<Proposal>(data || []);
    },
  });
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      return toCamelArray<Lead>(data || []);
    },
  });

  const [form, setForm] = useState({ leadId: "", serviceType: "reality_check", title: "", scope: "", price: "", timeline: "", deliverables: "", ndaRequired: 0 });
  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const create = useMutation({
    mutationFn: async () => {
      const { count } = await supabase.from("proposals").select("id", { count: "exact", head: true });
      const proposalId = `BECS-PR-${String((count || 0) + 1).padStart(3, "0")}`;
      const payload = toSnake({
        ...form,
        proposalId,
        leadId: form.leadId ? Number(form.leadId) : null,
        price: form.price ? Number(form.price) : null,
        status: "draft",
      });
      const { data, error } = await supabase.from("proposals").insert(payload).select().single();
      if (error) throw error;
      await supabase.from("automation_events").insert({
        type: "proposal_created", entity_type: "lead", entity_id: data.lead_id || 0,
        description: `Proposal ${proposalId} created`, status: "success",
        triggered_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proposals"] });
      qc.invalidateQueries({ queryKey: ["automation-events"] });
      toast({ title: "Proposal created" });
      setOpen(false);
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const extra: any = { status };
      if (status === "sent") extra.sent_at = new Date().toISOString();
      if (status === "accepted") extra.accepted_at = new Date().toISOString();
      const { error } = await supabase.from("proposals").update(extra).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proposals"] });
      toast({ title: "Proposal updated" });
    },
  });

  const getLead = (id: number | null) => id ? leads.find((l) => l.id === id) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Proposals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{proposals.length} total proposals</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} data-testid="button-add-proposal">
          <Plus size={14} className="mr-1" /> New Proposal
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-24 w-full rounded-lg" />)}</div>
      ) : proposals.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <FileText size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold text-sm">No proposals yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create a proposal after qualifying a lead.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {proposals.map((p) => {
            const lead = getLead(p.leadId);
            const Icon = statusIcons[p.status] || FileText;
            const deliverables = p.deliverables ? JSON.parse(p.deliverables) : [];
            return (
              <Card key={p.id} data-testid={`proposal-card-${p.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{p.title}</p>
                        <Badge variant="outline" className="text-xs">{label(p.serviceType)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.proposalId} {lead ? `· ${lead.name}` : ""}</p>
                      {p.scope && <p className="text-xs text-muted-foreground mt-1">{p.scope}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.price && (
                        <span className="text-lg font-bold text-primary flex items-center">
                          <DollarSign size={14} />{p.price.toLocaleString()}
                        </span>
                      )}
                      <span className={`status-${p.status} text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1`}>
                        <Icon size={11} /> {label(p.status)}
                      </span>
                    </div>
                  </div>
                  {deliverables.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {deliverables.map((d: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{d}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {p.timeline && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={11} /> {p.timeline}</span>}
                    {p.ndaRequired ? <Badge variant="outline" className="text-xs border-red-200 text-red-600">NDA Required</Badge> : null}
                    <div className="ml-auto flex gap-1">
                      {p.status === "draft" && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: p.id, status: "sent" })}>
                          Mark Sent
                        </Button>
                      )}
                      {p.status === "sent" && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: p.id, status: "accepted" })}>
                          Mark Accepted
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Proposal</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto">
            <div className="space-y-1">
              <Label className="text-xs">Title *</Label>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Foundation Builder — Client Name" data-testid="input-proposal-title" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Service Type</Label>
                <Select value={form.serviceType} onValueChange={(v) => update("serviceType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SERVICE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Lead</Label>
                <Select value={form.leadId} onValueChange={(v) => update("leadId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {leads.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Price</Label>
                <Input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="2497" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Timeline</Label>
                <Input value={form.timeline} onChange={(e) => update("timeline", e.target.value)} placeholder="90 days" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Scope</Label>
              <Textarea rows={2} value={form.scope} onChange={(e) => update("scope", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Deliverables (comma-separated)</Label>
              <Input value={form.deliverables} onChange={(e) => update("deliverables", e.target.value)} placeholder="Business audit, Offer framework, Pricing structure" />
            </div>
            <Button onClick={() => create.mutate()} disabled={create.isPending || !form.title} className="w-full" data-testid="button-save-proposal">
              {create.isPending ? "Saving…" : "Create Proposal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
