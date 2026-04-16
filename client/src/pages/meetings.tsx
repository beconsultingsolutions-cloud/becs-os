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
import type { Meeting, Client } from "@shared/schema";
import { CalendarDays, Plus, Clock, Video, FileText } from "lucide-react";

function label(s: string) { return (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

const TYPES = ["discovery","kickoff","strategy","check_in","milestone_review","final","follow_up"];
const STATUSES = ["scheduled","completed","cancelled","rescheduled"];

export default function MeetingsPage() {
  const { currentEntity } = useEntity();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ["meetings", currentEntity],
    queryFn: async () => {
      const { data } = await supabase.from("meetings").select("*").eq("entity_id", currentEntity).order("created_at", { ascending: false });
      return toCamelArray<Meeting>(data || []);
    },
  });
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["clients", currentEntity],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("*").eq("entity_id", currentEntity).order("created_at", { ascending: false });
      return toCamelArray<Client>(data || []);
    },
  });

  const [form, setForm] = useState({ clientId: "", type: "discovery", title: "", scheduledAt: "", duration: "60", notes: "" });
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("meetings").insert(toSnake({
        ...form,
        clientId: form.clientId && form.clientId !== "none" ? Number(form.clientId) : null,
        duration: Number(form.duration),
        status: "scheduled",
        entityId: currentEntity,
      }));
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      toast({ title: "Meeting created" });
      setOpen(false);
      setForm({ clientId: "", type: "discovery", title: "", scheduledAt: "", duration: "60", notes: "" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const upcoming = meetings.filter((m) => m.status === "scheduled");
  const past = meetings.filter((m) => m.status !== "scheduled");

  const getClient = (id: number | null) => id ? clients.find((c) => c.id === id) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Meetings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{upcoming.length} upcoming · {past.length} past</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} data-testid="button-add-meeting">
          <Plus size={14} className="mr-1" /> Schedule Meeting
        </Button>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-3">Upcoming</h2>
          <div className="grid gap-3">
            {upcoming.map((m) => {
              const client = getClient(m.clientId);
              return (
                <Card key={m.id} className="border-primary/15" data-testid={`meeting-card-${m.id}`}>
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <CalendarDays size={16} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{m.title}</p>
                        <Badge variant="outline" className="text-xs">{label(m.type)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Time TBD"}
                        {m.duration ? ` · ${m.duration} min` : ""}
                      </p>
                      {client && <p className="text-xs text-muted-foreground mt-0.5">Client: {client.name}</p>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-3">Past</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {past.map((m) => {
                  const client = getClient(m.clientId);
                  return (
                    <div key={m.id} className="px-5 py-3" data-testid={`meeting-past-${m.id}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{m.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString() : "—"} · {label(m.type)}
                            {client ? ` · ${client.name}` : ""}
                          </p>
                        </div>
                        <span className={`status-${m.status} text-xs font-medium px-2 py-0.5 rounded-full`}>{label(m.status)}</span>
                      </div>
                      {m.recap && (
                        <div className="mt-2 p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground leading-relaxed">{m.recap}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {meetings.length === 0 && !isLoading && (
        <Card><CardContent className="py-12 text-center">
          <CalendarDays size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold text-sm">No meetings yet</p>
          <p className="text-xs text-muted-foreground mt-1">Schedule a discovery call or kickoff meeting.</p>
        </CardContent></Card>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Meeting</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Title *</Label>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Kickoff — Client Name" data-testid="input-meeting-title" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={(v) => update("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{label(t)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Client</Label>
                <Select value={form.clientId} onValueChange={(v) => update("clientId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client</SelectItem>
                    {clients.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date & Time</Label>
                <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => update("scheduledAt", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duration (min)</Label>
                <Input type="number" value={form.duration} onChange={(e) => update("duration", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
            </div>
            <Button onClick={() => create.mutate()} disabled={create.isPending || !form.title} className="w-full" data-testid="button-save-meeting">
              {create.isPending ? "Saving…" : "Schedule Meeting"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
