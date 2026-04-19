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
import { FileText, Plus, DollarSign, Clock, CheckCircle2, Send, Eye, Download, Link2, PenLine } from "lucide-react";
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

/**
 * Deliverables may be stored as a JSON-encoded array (newer proposals) or as
 * a plain comma-separated string (older or admin-created proposals). Parse
 * defensively so malformed data never crashes the list.
 */
function parseDeliverables(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // Fall through to comma-split
    }
  }
  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const SERVICE_OPTIONS = [
  "reality_check",
  "foundation_builder",
  "business_launch",
  "strategy_ops_session",
  "accelerator",
  "brand_identity",
  "gtm_launch",
  "compliance_coaching",
  "retainer",
  "add_on",
];
const STATUS_OPTIONS = ["draft","sent","viewed","accepted","declined","expired"];

const statusIcons: Record<string, any> = {
  draft: FileText, sent: Send, viewed: Eye, accepted: CheckCircle2, declined: FileText, expired: Clock,
};

interface ProposalSignature {
  id: number;
  proposalId: number;
  signerName: string;
  signerEmail: string;
  signatureDataUrl: string;
  signedAt: string;
  ip: string | null;
  userAgent: string | null;
  acceptedTerms: boolean;
}

export default function ProposalsPage() {
  const { currentEntity } = useEntity();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  // Signature dialog state
  const [sigDialogOpen, setSigDialogOpen] = useState(false);
  const [viewingSig, setViewingSig] = useState<ProposalSignature | null>(null);

  const { data: proposals = [], isLoading } = useQuery<Proposal[]>({
    queryKey: ["proposals", currentEntity],
    queryFn: async () => {
      const { data } = await supabase
        .from("proposals")
        .select("*")
        .eq("entity_id", currentEntity)
        .order("created_at", { ascending: false });
      return toCamelArray<Proposal>(data || []);
    },
  });

  // Load signatures for all accepted proposals
  const acceptedProposalIds = proposals.filter((p) => p.status === "accepted").map((p) => p.id);
  const { data: signatures = [] } = useQuery<ProposalSignature[]>({
    queryKey: ["proposal-signatures", acceptedProposalIds],
    queryFn: async () => {
      if (acceptedProposalIds.length === 0) return [];
      const { data } = await supabase
        .from("proposal_signatures")
        .select("*")
        .in("proposal_id", acceptedProposalIds);
      return toCamelArray<ProposalSignature>(data || []);
    },
    enabled: acceptedProposalIds.length > 0,
  });

  const sigMap: Record<number, ProposalSignature> = {};
  for (const s of signatures) {
    sigMap[s.proposalId] = s;
  }

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

  const copyShareLink = async (shareToken: string) => {
    const url = `${window.location.origin}/#/p/${shareToken}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "Share link copied" });
  };

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
            const deliverables = parseDeliverables(p.deliverables);
            const sig = sigMap[p.id];
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
                      {p.status === "accepted" && sig && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Signed by {sig.signerName} on {new Date(sig.signedAt).toLocaleDateString()}
                        </p>
                      )}
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
                    <div className="ml-auto flex gap-1 flex-wrap">
                      {p.shareToken && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => copyShareLink(p.shareToken!)}
                          data-testid={`button-copy-link-${p.id}`}
                          title="Copy share link"
                        >
                          <Link2 size={11} className="mr-1" /> Copy link
                        </Button>
                      )}
                      {p.status === "accepted" && sig && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-green-300 text-green-700"
                          onClick={() => { setViewingSig(sig); setSigDialogOpen(true); }}
                          data-testid={`button-view-sig-${p.id}`}
                        >
                          <PenLine size={11} className="mr-1" /> View signature
                        </Button>
                      )}
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

      {/* Create Proposal Dialog */}
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

      {/* View Signature Dialog */}
      <Dialog open={sigDialogOpen} onOpenChange={setSigDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Signature Details</DialogTitle></DialogHeader>
          {viewingSig && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Signer Name</p>
                  <p className="font-medium">{viewingSig.signerName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Signer Email</p>
                  <p className="font-medium">{viewingSig.signerEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Signed At</p>
                  <p className="font-medium">{new Date(viewingSig.signedAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Terms Accepted</p>
                  <p className="font-medium">{viewingSig.acceptedTerms ? "Yes" : "No"}</p>
                </div>
                {viewingSig.ip && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">IP Address</p>
                    <p className="font-medium font-mono text-xs">{viewingSig.ip}</p>
                  </div>
                )}
              </div>
              {viewingSig.signatureDataUrl && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Signature</p>
                  <div className="border rounded-lg p-3 bg-white">
                    <img
                      src={viewingSig.signatureDataUrl}
                      alt="Signature"
                      className="max-w-full h-auto max-h-32 mx-auto"
                      data-testid="signature-image"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
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
