import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, toSnake, toCamelArray } from "@/lib/supabase";
import { useEntity } from "@/lib/entity-context";
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
import type { Proposal, Lead, Client } from "@shared/schema";
import { FileText, Plus, DollarSign, Clock, CheckCircle2, Send, Eye, Download } from "lucide-react";
import {
  downloadProposalPDF,
  DEFAULT_MISSION,
  DEFAULT_VALUE_PROP,
  DEFAULT_TIERS,
  DEFAULT_NEXT_STEPS,
  type ProposalInput,
  type ProposalTier,
} from "@/lib/proposal-generator";
import { SERVICE_TEMPLATES } from "@/lib/service-templates";

function label(s: string) { return (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

const SERVICE_OPTIONS = ["reality_check","foundation_builder","business_launch","retainer","add_on"];
const STATUS_OPTIONS = ["draft","sent","viewed","accepted","declined","expired"];

const statusIcons: Record<string, any> = {
  draft: FileText, sent: Send, viewed: Eye, accepted: CheckCircle2, declined: FileText, expired: Clock,
};

export default function ProposalsPage() {
  const { currentEntity } = useEntity();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: proposals = [], isLoading } = useQuery<Proposal[]>({
    queryKey: ["proposals", currentEntity],
    queryFn: async () => {
      const { data } = await supabase.from("proposals").select("*").eq("entity_id", currentEntity).order("created_at", { ascending: false });
      return toCamelArray<Proposal>(data || []);
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

  // ─── PDF generator state ──────────────────────────────────────────────
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfProposal, setPdfProposal] = useState<Proposal | null>(null);
  const [pdfForm, setPdfForm] = useState<{
    clientName: string;
    clientShortName: string;
    presenterName: string;
    presenterEmail: string;
    mission: string;
    valueProp: string;
    journeyIntro: string;
    selectedServices: string[];
    recommendedPathIntro: string;
    nextSteps: string;
    closingTagline: string;
  }>({
    clientName: "",
    clientShortName: "",
    presenterName: "Brandon Bynum",
    presenterEmail: "beconsultingsolutions@gmail.com",
    mission: DEFAULT_MISSION,
    valueProp: DEFAULT_VALUE_PROP,
    journeyIntro: "",
    selectedServices: [],
    recommendedPathIntro: "",
    nextSteps: DEFAULT_NEXT_STEPS.join("\n"),
    closingTagline: "",
  });

  const openPdfDialog = (p: Proposal) => {
    const lead = leads.find((l) => l.id === p.leadId);
    // Hybrid autofill: client name + service from proposal; narrative editable
    const clientName =
      lead?.name ||
      clients.find((c) => c.name)?.name ||
      p.title ||
      "Client";
    const shortName = clientName
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 5);
    setPdfProposal(p);
    setPdfForm((f) => ({
      ...f,
      clientName,
      clientShortName: shortName,
      selectedServices: p.serviceType ? [p.serviceType] : [],
      journeyIntro: p.scope || "",
      closingTagline: `${clientName} – Scaling with clarity, strategy, and partnership.`,
    }));
    setPdfOpen(true);
  };

  const handleGeneratePdf = () => {
    // Build tiers: if user selected services, pull from templates; else defaults
    const tiers: ProposalTier[] =
      pdfForm.selectedServices.length > 0
        ? pdfForm.selectedServices
            .map((key) => SERVICE_TEMPLATES.find((s) => s.key === key))
            .filter((s): s is (typeof SERVICE_TEMPLATES)[number] => !!s)
            .map((s) => ({
              name: s.name.toUpperCase(),
              sublabel: `(${s.duration})`,
              focus: s.tagline,
              scope: s.deliverables,
              deliverable:
                s.milestones[s.milestones.length - 1]?.title || s.tagline,
              investment:
                s.price + (s.paymentNote ? ` · ${s.paymentNote}` : ""),
            }))
        : DEFAULT_TIERS;

    const input: ProposalInput = {
      clientName: pdfForm.clientName,
      clientShortName: pdfForm.clientShortName || undefined,
      presenterName: pdfForm.presenterName,
      presenterEmail: pdfForm.presenterEmail || undefined,
      missionStatement: pdfForm.mission,
      valueProposition: pdfForm.valueProp,
      journeyIntro: pdfForm.journeyIntro || undefined,
      tiers,
      recommendedPathIntro: pdfForm.recommendedPathIntro || undefined,
      nextSteps: pdfForm.nextSteps
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      closingTagline: pdfForm.closingTagline || undefined,
    };
    downloadProposalPDF(
      input,
      pdfProposal
        ? `${pdfProposal.proposalId}-${pdfForm.clientName.replace(/[^a-zA-Z0-9]+/g, "-")}.pdf`
        : undefined
    );
    toast({ title: "Proposal PDF downloaded" });
    setPdfOpen(false);
  };

  const toggleService = (key: string) => {
    setPdfForm((f) => ({
      ...f,
      selectedServices: f.selectedServices.includes(key)
        ? f.selectedServices.filter((k) => k !== key)
        : [...f.selectedServices, key],
    }));
  };

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
      payload.entity_id = currentEntity;
      const { data, error } = await supabase.from("proposals").insert(payload).select().single();
      if (error) throw error;
      await supabase.from("automation_events").insert({
        type: "proposal_created", entity_type: "lead", record_id: data.lead_id || 0,
        description: `Proposal ${proposalId} created`, status: "success",
        triggered_at: new Date().toISOString(), entity_id: currentEntity,
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => openPdfDialog(p)}
                        data-testid={`button-generate-pdf-${p.id}`}
                      >
                        <Download size={11} className="mr-1" /> Generate PDF
                      </Button>
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

      {/* ─── Generate PDF Dialog ─────────────────────────────────────── */}
      <Dialog open={pdfOpen} onOpenChange={setPdfOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Proposal PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              Client name and service are auto-filled from the proposal. Edit the narrative sections below as needed — the PDF uses the B.A.S layout with cover, mission, growth journey, intake, pricing matrix, and next steps.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Client Name *</Label>
                <Input
                  value={pdfForm.clientName}
                  onChange={(e) => setPdfForm((f) => ({ ...f, clientName: e.target.value }))}
                  data-testid="input-pdf-client-name"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Short Name / Initials</Label>
                <Input
                  value={pdfForm.clientShortName}
                  onChange={(e) => setPdfForm((f) => ({ ...f, clientShortName: e.target.value }))}
                  placeholder="B.A.S"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Presenter Name</Label>
                <Input
                  value={pdfForm.presenterName}
                  onChange={(e) => setPdfForm((f) => ({ ...f, presenterName: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Presenter Email</Label>
                <Input
                  value={pdfForm.presenterEmail}
                  onChange={(e) => setPdfForm((f) => ({ ...f, presenterEmail: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Services to Include (auto-fills pricing tiers)</Label>
              <div className="flex flex-wrap gap-1.5">
                {SERVICE_TEMPLATES.map((s) => {
                  const selected = pdfForm.selectedServices.includes(s.key);
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => toggleService(s.key)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-border"
                      }`}
                      data-testid={`pdf-service-${s.key}`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to use the default Plan / Evolve / Succeed tiers.
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Mission Statement</Label>
              <Textarea
                rows={3}
                value={pdfForm.mission}
                onChange={(e) => setPdfForm((f) => ({ ...f, mission: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Value Proposition</Label>
              <Textarea
                rows={3}
                value={pdfForm.valueProp}
                onChange={(e) => setPdfForm((f) => ({ ...f, valueProp: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Growth Journey — Client Introduction</Label>
              <Textarea
                rows={3}
                value={pdfForm.journeyIntro}
                onChange={(e) => setPdfForm((f) => ({ ...f, journeyIntro: e.target.value }))}
                placeholder="Based in Madrid, the client is a streetwear brand development studio…"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Next Steps (one per line)</Label>
              <Textarea
                rows={4}
                value={pdfForm.nextSteps}
                onChange={(e) => setPdfForm((f) => ({ ...f, nextSteps: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Closing Tagline</Label>
              <Input
                value={pdfForm.closingTagline}
                onChange={(e) => setPdfForm((f) => ({ ...f, closingTagline: e.target.value }))}
              />
            </div>

            <Button
              onClick={handleGeneratePdf}
              disabled={!pdfForm.clientName}
              className="w-full"
              data-testid="button-download-pdf"
            >
              <Download size={14} className="mr-1" /> Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
