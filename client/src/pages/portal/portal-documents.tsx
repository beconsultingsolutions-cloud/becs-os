/**
 * /portal/documents — Client view of their assigned documents.
 *
 * Two surfaces:
 *   1. List view (default) — groups uploaded PDFs by kind, with a separate
 *      "Templates" group for canonical BECS docs (MSA, Addendum, Welcome
 *      Packet, ToS, Privacy) rendered via MasterDocLayout.
 *   2. Reader view — when a registry doc is selected (?doc=<id>), the master-doc
 *      layout renders inline so the client can read their contract / packet in
 *      the same styled surface as the public proposal.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PortalPageShell } from "@/lib/client-layout";
import { supabase, toCamelArray } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  Loader2,
  FileText,
  FolderOpen,
  Download,
  ArrowLeft,
  ScrollText,
} from "lucide-react";

import MasterDocRenderer from "@/components/master-doc/MasterDocRenderer";
import {
  MASTER_DOC_REGISTRY,
  getMasterDoc,
  type MasterDocId,
  type TokenMap,
} from "@/lib/master-doc-registry";

interface ClientRow {
  id: number;
  name: string | null;
}

interface DocumentRow {
  id: number;
  title: string;
  fileUrl: string;
  kind: string;
  projectId: number | null;
  visibleToClient: boolean;
  createdAt: string;
}

const KIND_LABEL: Record<string, string> = {
  contract: "Contract",
  proposal: "Proposal",
  deliverable: "Deliverable",
  onboarding: "Onboarding",
  report: "Report",
  invoice: "Invoice",
  other: "Document",
};

/* Which registry docs are surfaced inside the portal by default. */
const PORTAL_TEMPLATES: { id: MasterDocId; label: string; kind: string }[] = [
  { id: "onboarding-welcome", label: "Welcome Packet", kind: "onboarding" },
  { id: "msa", label: "Master Service Agreement", kind: "contract" },
  { id: "addendum-noncirc", label: "Non-Circumvention Addendum", kind: "contract" },
  { id: "tos", label: "Terms of Service", kind: "policy" },
  { id: "privacy", label: "Privacy Policy", kind: "policy" },
];

export default function PortalDocumentsPage() {
  const { becsUser } = useAuth();
  const [selected, setSelected] = useState<MasterDocId | null>(null);

  const clientQuery = useQuery<ClientRow | null>({
    queryKey: ["portal", "client-for-docs", becsUser?.email],
    enabled: !!becsUser?.email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id,name")
        .ilike("email", becsUser!.email)
        .eq("portal_access_active", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return toCamelArray<ClientRow>([data])[0];
    },
  });

  const clientId = clientQuery.data?.id;
  const clientName = clientQuery.data?.name || "your business";

  const docsQuery = useQuery<DocumentRow[]>({
    queryKey: ["portal", "documents", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_documents")
        .select("id,title,file_url,kind,project_id,visible_to_client,created_at")
        .eq("client_id", clientId!)
        .eq("visible_to_client", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return toCamelArray<DocumentRow>(data ?? []);
    },
  });

  const docs = docsQuery.data ?? [];

  const tokens: TokenMap = useMemo(
    () => ({
      CLIENT_NAME: clientName,
      CLIENT_LOCATION: "—",
      CLIENT_BUSINESS_TYPE: "Client business",
      INDUSTRY: "Client industry",
      INDUSTRY_ALT: "",
      RETAINER_PRICE: "Per signed SOW",
      EFFECTIVE_DATE: new Date().toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      }),
      DEPOSIT_AMOUNT: "50% of total investment",
      SERVICE_NAME: "Per signed SOW",
      KICKOFF_DATE: "Per signed SOW",
      ADDENDUM_DATE: new Date().toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      }),
      SOW_REFERENCE: "Per signed SOW",
    }),
    [clientName]
  );

  // ── Reader view ────────────────────────────────────────────────────
  if (selected) {
    return (
      <PortalPageShell>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          data-testid="md-back"
        >
          <ArrowLeft size={16} /> Back to documents
        </button>
        <MasterDocRenderer doc={getMasterDoc(selected)} tokens={tokens} />
      </PortalPageShell>
    );
  }

  // ── List view ──────────────────────────────────────────────────────
  // Group uploaded docs by kind
  const grouped = docs.reduce<Record<string, DocumentRow[]>>((acc, d) => {
    const key = d.kind || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  return (
    <PortalPageShell>
      <section className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#0F6E56]">
            Your portal
          </div>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold text-slate-900">Documents</h1>
          <p className="mt-2 text-slate-600">
            Contracts, proposals, deliverables, and shared resources — all in one place.
          </p>
        </div>

        {/* Templates rail — always present, even if no uploaded docs yet */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <ScrollText size={16} className="text-[#2B287E]" />
            <div>
              <div className="text-sm font-bold text-slate-900">BECS templates</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Canonical contract, addendum, and welcome documents
              </div>
            </div>
          </div>
          <ul className="divide-y divide-slate-100">
            {PORTAL_TEMPLATES.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelected(t.id)}
                  className="w-full text-left flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group"
                  data-testid={`md-template-${t.id}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#2B287E]/10 text-[#2B287E] flex items-center justify-center flex-shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 truncate">{t.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {KIND_LABEL[t.kind] ?? "Document"} · canonical
                    </div>
                  </div>
                  <div className="text-xs text-[#0F6E56] font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    Open
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {clientQuery.isLoading || docsQuery.isLoading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
            <Loader2 className="animate-spin mx-auto text-slate-400" size={22} />
            <div className="mt-3 text-sm">Loading your documents…</div>
          </div>
        ) : !clientQuery.data ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
            Portal access pending.
          </div>
        ) : docs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <FolderOpen size={22} className="text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">No signed PDFs yet</h3>
            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
              As your engagement progresses, signed contracts and deliverables will appear here.
              In the meantime, your BECS templates are available above.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([kind, items]) => (
              <div
                key={kind}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-slate-100">
                  <div className="text-sm font-bold text-slate-900">
                    {KIND_LABEL[kind] ?? kind}s
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </div>
                </div>
                <ul className="divide-y divide-slate-100">
                  {items.map((d) => (
                    <li key={d.id}>
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group"
                        data-testid={`doc-${d.id}`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#1e1c5a]/10 text-[#1e1c5a] flex items-center justify-center flex-shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900 truncate">
                            {d.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Added{" "}
                            {new Date(d.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                        <Download
                          size={16}
                          className="text-slate-400 group-hover:text-[#0F6E56] flex-shrink-0"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </PortalPageShell>
  );
}
