import { useQuery } from "@tanstack/react-query";
import { supabase, toCamelArray } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AutomationEvent } from "@shared/schema";
import { Zap, CheckCircle2, XCircle, Clock } from "lucide-react";

function label(s: string) { return (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

function StatusIcon({ status }: { status: string }) {
  if (status === "success") return <CheckCircle2 size={14} className="text-green-500 shrink-0" />;
  if (status === "failed") return <XCircle size={14} className="text-red-500 shrink-0" />;
  return <Clock size={14} className="text-amber-500 shrink-0" />;
}

export default function AutomationPage() {
  const { data: events = [], isLoading } = useQuery<AutomationEvent[]>({
    queryKey: ["automation-events"],
    queryFn: async () => {
      const { data } = await supabase.from("automation_events").select("*").order("triggered_at", { ascending: false });
      return toCamelArray<AutomationEvent>(data || []);
    },
  });

  const grouped: Record<string, AutomationEvent[]> = {};
  for (const e of events) {
    const date = new Date(e.triggeredAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(e);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Zap size={20} className="text-primary" /> Automation Log
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{events.length} events recorded</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-14 w-full rounded-lg" />)}</div>
      ) : events.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Zap size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold text-sm">No automation events yet</p>
          <p className="text-xs text-muted-foreground mt-1">Events are logged when forms are submitted, records are created, and workflows are triggered.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dayEvents]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{date}</p>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {dayEvents.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 px-5 py-3" data-testid={`automation-event-${event.id}`}>
                        <StatusIcon status={event.status} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{event.description}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge variant="outline" className="text-xs">{label(event.type)}</Badge>
                            {event.entityType && <span className="text-xs text-muted-foreground">{label(event.entityType)} #{event.entityId}</span>}
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.triggeredAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${event.status === "success" ? "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400" : event.status === "failed" ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400" : "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"}`}>
                          {label(event.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
