import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, toSnake, toCamelArray } from "@/lib/supabase";
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Client } from "@shared/schema";
import { Plus, Search, ArrowRight, CheckCircle2, Clock, UserCheck } from "lucide-react";

function label(s: string) { return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

function ClientForm({ onSuccess, initial }: { onSuccess: () => void; initial?: Partial<Client> }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    businessName: initial?.businessName ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    status: initial?.status ?? "active",
    portalAccessActive: initial?.portalAccessActive ?? 0,
    onboardingComplete: initial?.onboardingComplete ?? 0,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (initial?.id) {
        const { error } = await supabase.from("clients").update(toSnake(form)).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { count } = await supabase.from("clients").select("id", { count: "exact", head: true });
        const clientId = `BECS-C-${String((count || 0) + 1).padStart(3, "0")}`;
        const { data, error } = await supabase.from("clients").insert({ ...toSnake(form), client_id: clientId }).select().single();
        if (error) throw error;
        await supabase.from("automation_events").insert({
          type: "client_activated", entity_type: "client", entity_id: data.id,
          description: `Client account ${clientId} activated`, status: "success",
          triggered_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["automation-events"] });
      toast({ title: initial?.id ? "Client updated" : "Client created" });
      onSuccess();
    },
    onError: () => toast({ title: "Error saving client", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Full Name *</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} data-testid="input-client-name" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Business Name</Label>
          <Input value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Email *</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["active","paused","complete","archived"].map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Portal Access</Label>
          <Select value={String(form.portalAccessActive)} onValueChange={(v) => setForm((f) => ({ ...f, portalAccessActive: Number(v) }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Active</SelectItem>
              <SelectItem value="0">Locked</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Onboarding</Label>
          <Select value={String(form.onboardingComplete)} onValueChange={(v) => setForm((f) => ({ ...f, onboardingComplete: Number(v) }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Complete</SelectItem>
              <SelectItem value="0">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || !form.email} className="w-full" data-testid="button-save-client">
        {mutation.isPending ? "Saving…" : initial?.id ? "Update Client" : "Create Client"}
      </Button>
    </div>
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      return toCamelArray<Client>(data || []);
    },
  });

  const filtered = clients.filter((c) =>
    search === "" || [c.name, c.businessName, c.email].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const active = filtered.filter((c) => c.status === "active");
  const other = filtered.filter((c) => c.status !== "active");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{clients.length} total clients</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8 w-48 text-sm h-9" placeholder="Search clients…" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search-clients" />
          </div>
          <Button size="sm" onClick={() => setOpen(true)} data-testid="button-add-client">
            <Plus size={14} className="mr-1" /> Add Client
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-36 w-full rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-5">
          {active.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-3">Active Clients</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.map((client) => (
                  <Card key={client.id} className="hover:shadow-md transition-shadow" data-testid={`client-card-${client.id}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {client.portalAccessActive ? (
                            <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:border-green-700 dark:text-green-400">Portal Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">Portal Locked</Badge>
                          )}
                        </div>
                      </div>
                      <p className="font-semibold text-sm">{client.name}</p>
                      {client.businessName && <p className="text-xs text-muted-foreground">{client.businessName}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">{client.email}</p>
                      <div className="flex items-center gap-1.5 mt-3">
                        {client.onboardingComplete ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"><CheckCircle2 size={11} /> Onboarding complete</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"><Clock size={11} /> Onboarding pending</span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Link href={`/clients/${client.id}`}>
                          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs">
                            View <ArrowRight size={11} className="ml-1" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setEditing(client)}>Edit</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {other.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-3">Other Clients</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {other.map((client) => (
                  <Card key={client.id} className="opacity-70 hover:opacity-100 transition-opacity" data-testid={`client-card-${client.id}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-sm">{client.name}</p>
                        <span className={`status-${client.status} text-xs font-medium px-2 py-0.5 rounded-full`}>{label(client.status)}</span>
                      </div>
                      {client.businessName && <p className="text-xs text-muted-foreground">{client.businessName}</p>}
                      <div className="flex gap-2 mt-3">
                        <Link href={`/clients/${client.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs">View</Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setEditing(client)}>Edit</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <UserCheck size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="font-semibold text-sm">No clients yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create a client when a lead converts after contract and payment.</p>
                <Button size="sm" className="mt-4" onClick={() => setOpen(true)}>Add First Client</Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
          <ClientForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Client — {editing?.name}</DialogTitle></DialogHeader>
          {editing && <ClientForm onSuccess={() => setEditing(null)} initial={editing} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
