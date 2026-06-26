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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { LegalDoc, Client } from "@shared/schema";
import { Scale, Plus, FileText, DollarSign, Lock, Unlock, Eye, ArrowLeft } from "lucide-react";
import MasterDocRenderer from "@/components/master-doc/MasterDocRenderer";
import {
  MASTER_DOC_REGISTRY,
  getMasterDoc,
  type MasterDocId,
  type TokenMap,
} from "@/lib/master-doc-registry";

const MASTER_DOC_TEMPLATE_OPTIONS: { id: MasterDocId; label: string }[] = [
  { id: "msa", label: "Master Service Agreement" },
  { id: "addendum-noncirc", label: "Non-Circumvention Addendum" },
  { id: "addendum-noncirc-home-health", label: "Non-Circumvention — Home Health Variant" },
  { id: "onboarding-welcome", label: "Welcome Packet" },
  { id: "proposal-canonical", label: "Master Proposal Template" },
  { id: "tos", label: "Terms of Service" },
  { id: "privacy", label: "Privacy Policy" },
];

function label(s: string) { return (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

const DOC_TYPES = ["nda","agreement","sow","invoice","change_order","completion_cert"];
const DOC_STATUSES = ["draft","sent","signed","paid","complete","archived"];

export default function LegalPage() {
  const { currentEntity } = useEntity();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<MasterDocId | null>(null);
  const [previewClient, setPreviewClient] = useState<string>("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: docs = [], isLoading } = useQuery<LegalDoc[]>({
    queryKey: ["legal", currentEntity],
    queryFn: async () => {
      const { data } = await supabase.from("legal_docs").select("*").eq("entity_id", currentEntity).order("created_at", { ascending: false });
      return toCamelArray<LegalDoc>(data || []);
    },
  });
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["clients", currentEntity],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("*").eq("entity_id", currentEntity).order("created_at", { ascending: false });
      return toCamelArray<Client>(data || []);
    },
  });

  const [form, setForm] = useState({ clientId: "", type: "agreement", title: "", amount: "", status: "draft" });
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const create = useMutation({
    mutationFn: async () => {
      const { count } = await supabase.from("legal_docs").select("id", { count: "exact", head: true });
      const docId = `BECS-DOC-${String((count || 0) + 1).padStart(3, "0")}`;
      const { error } = await supabase.from("legal_docs").insert(toSnake({
        ...form,
        docId,
        clientId: form.clientId ? Number(form.clientId) : null,
        amount: form.amount ? Number(form.amount) : null,
        entityId: currentEntity,
      }));
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["legal"] });
      toast({ title: "Document created" });
      setOpen(false);
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const updateDoc = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const extra: any = { status };
      if (status === "signed") extra.signed_at = new Date().toISOString();
      if (status === "paid") extra.paid_at = new Date().toISOString();
      const { error } = await supabase.from("legal_docs").update(extra).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["legal"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Document updated" });
    },
  });

  const getClient = (id: number | null) => id ? clients.find((c) => c.id === id) : null;

  // Reader view — preview a canonical master doc with tokens substituted.
  if (preview) {
    const sampleClientName = previewClient || "[Sample Client]";
    const tokens: TokenMap = {
      CLIENT_NAME: sampleClientName,
      CLIENT_LOCATION: "[City, State]",
      CLIENT_BUSINESS_TYPE: "[Business type]",
      INDUSTRY: "[Industry]",
      INDUSTRY_ALT: "",
      RETAINER_PRICE: "[Per signed SOW]",
      HERO_HEADLINE: `A plan to <em>move</em> ${sampleClientName} forward`,
      HERO_SUBLINE: "Preview rendered from the canonical Notion source.",
      EFFECTIVE_DATE: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      ADDENDUM_DATE: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      DEPOSIT_AMOUNT: "50% of total investment",
      SERVICE_NAME: "[Service]",
      KICKOFF_DATE: "[TBD]",
      SOW_REFERENCE: "[SOW reference]",
    };
    return (
      <div className="-m-6">
        <div className="sticky top-0 z-50 bg-white border-b border-border px-6 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setPreview(null)} data-testid="md-preview-close">
            <ArrowLeft size={14} className="mr-1" /> Back to Legal
          </Button>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Preview as:</Label>
            <Input
              value={previewClient}
              onChange={(e) => setPreviewClient(e.target.value)}
              placeholder="[Sample Client]"
              className="w-56 h-8 text-xs"
            />
          </div>
        </div>
        <MasterDocRenderer doc={getMasterDoc(preview)} tokens={tokens} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Legal & Documents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{docs.length} documents</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} data-testid="button-add-doc">
          <Plus size={14} className="mr-1" /> New Document
        </Button>
      </div>

      {/* Master Doc templates — render canonical legal docs in master-doc layout */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Eye size={14} className="text-[#2B287E]" /> Master Doc Templates
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Preview canonical legal documents rendered in the BECS Master Doc layout.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {MASTER_DOC_TEMPLATE_OPTIONS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setPreview(t.id)}
                className="text-left px-3 py-2.5 rounded-md border border-border bg-white hover:bg-[#F4F7F5] hover:border-[#2B287E]/30 transition-colors"
                data-testid={`md-template-${t.id}`}
              >
                <div className="text-sm font-semibold text-slate-900">{t.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Preview →</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-20 w-full rounded-lg" />)}</div>
      ) : docs.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Scale size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold text-sm">No documents yet</p>
          <p className="text-xs text-muted-foreground mt-1">Agreements, NDAs, invoices, and SOWs appear here.</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">Document</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Type</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Client</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground text-right">Amount</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {docs.map((doc) => {
                  const client = getClient(doc.clientId);
                  return (
                    <tr key={doc.id} className="hover:bg-muted/30 transition-colors" data-testid={`doc-table-row-${doc.id}`}>
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">{doc.docId}</p>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs">{label(doc.type)}</Badge>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground hidden md:table-cell">
                        {client?.name || "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {doc.amount ? <span className="text-sm font-semibold">${doc.amount.toLocaleString()}</span> : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`status-${doc.status} text-xs font-medium px-2 py-0.5 rounded-full`}>{label(doc.status)}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {doc.status === "draft" && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateDoc.mutate({ id: doc.id, status: "sent" })}>Send</Button>
                          )}
                          {doc.status === "sent" && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateDoc.mutate({ id: doc.id, status: "signed" })}>Mark Signed</Button>
                          )}
                          {doc.status === "signed" && doc.amount && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-green-600" onClick={() => updateDoc.mutate({ id: doc.id, status: "paid" })}>Mark Paid</Button>
                          )}
                          {doc.status === "paid" && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateDoc.mutate({ id: doc.id, status: "archived" })}>Archive</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Document</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Title *</Label>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Service Agreement — Client" data-testid="input-doc-title" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={(v) => update("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{label(t)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Client</Label>
                <Select value={form.clientId} onValueChange={(v) => update("clientId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Amount</Label>
              <Input type="number" value={form.amount} onChange={(e) => update("amount", e.target.value)} placeholder="2497" />
            </div>
            <Button onClick={() => create.mutate()} disabled={create.isPending || !form.title} className="w-full" data-testid="button-save-doc">
              {create.isPending ? "Saving…" : "Create Document"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
