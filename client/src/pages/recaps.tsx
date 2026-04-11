import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import type { Recap, Client } from "@shared/schema";
import { BookOpen, Plus, FileText, Calendar } from "lucide-react";

function label(s: string) { return (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

const RECAP_TYPES = ["intake","onboarding","discovery","milestone","project","completion","admin_snapshot"];

export default function RecapsPage() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: recaps = [], isLoading } = useQuery<Recap[]>({
    queryKey: ["/api/recaps"],
    queryFn: () => apiRequest("GET", "/api/recaps").then((r) => r.json()),
  });
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest("GET", "/api/clients").then((r) => r.json()),
  });

  const [form, setForm] = useState({ clientId: "", type: "milestone", title: "", content: "", source: "manual" });
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const create = useMutation({
    mutationFn: () => apiRequest("POST", "/api/recaps", {
      ...form,
      clientId: form.clientId ? Number(form.clientId) : null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/recaps"] });
      toast({ title: "Recap created" });
      setOpen(false);
      setForm({ clientId: "", type: "milestone", title: "", content: "", source: "manual" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const getClient = (id: number | null) => id ? clients.find((c) => c.id === id) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Recaps & Summaries</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{recaps.length} summaries generated</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} data-testid="button-add-recap">
          <Plus size={14} className="mr-1" /> New Recap
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-32 w-full rounded-lg" />)}</div>
      ) : recaps.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <BookOpen size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold text-sm">No recaps yet</p>
          <p className="text-xs text-muted-foreground mt-1">Recaps are generated from meetings, milestones, and project events.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {recaps.map((recap) => {
            const client = getClient(recap.clientId);
            return (
              <Card key={recap.id} data-testid={`recap-card-${recap.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-primary shrink-0" />
                      <CardTitle className="text-sm font-semibold">{recap.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{label(recap.type)}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(recap.generatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {client && <p className="text-xs text-muted-foreground ml-5">Client: {client.name}</p>}
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/40 rounded-lg p-4">
                    <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{recap.content}</p>
                  </div>
                  {recap.source && <p className="text-xs text-muted-foreground mt-2">Source: {label(recap.source)}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Recap</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Title *</Label>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Kickoff Recap — Client" data-testid="input-recap-title" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={(v) => update("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RECAP_TYPES.map((t) => <SelectItem key={t} value={t}>{label(t)}</SelectItem>)}</SelectContent>
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
              <Label className="text-xs">Content *</Label>
              <Textarea rows={6} value={form.content} onChange={(e) => update("content", e.target.value)} placeholder="Meeting notes, findings, recommendations…" />
            </div>
            <Button onClick={() => create.mutate()} disabled={create.isPending || !form.title || !form.content} className="w-full" data-testid="button-save-recap">
              {create.isPending ? "Saving…" : "Create Recap"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
