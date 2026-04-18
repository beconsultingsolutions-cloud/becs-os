import { useQuery } from "@tanstack/react-query";
import { PortalPageShell } from "@/lib/client-layout";
import { supabase, toCamelArray } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Loader2, FileText, FolderOpen, Download } from "lucide-react";

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

export default function PortalDocumentsPage() {
  const { becsUser } = useAuth();

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

  // Group by kind
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
          <div className="text-xs font-semibold uppercase tracking-wider text-[hsl(83,60%,45%)]">
            Your portal
          </div>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold text-slate-900">Documents</h1>
          <p className="mt-2 text-slate-600">
            Contracts, proposals, deliverables, and shared resources — all in one place.
          </p>
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
            <h3 className="mt-4 text-lg font-bold text-slate-900">No documents yet</h3>
            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
              Your contracts, deliverables, and shared resources will appear here as your
              engagement progresses.
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
                        <div className="w-10 h-10 rounded-lg bg-[hsl(232,45%,18%)]/5 text-[hsl(232,45%,18%)] flex items-center justify-center flex-shrink-0">
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
                          className="text-slate-400 group-hover:text-[hsl(83,60%,45%)] flex-shrink-0"
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
