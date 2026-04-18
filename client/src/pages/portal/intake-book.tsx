import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { PublicPageShell } from "@/lib/client-layout";
import { Button } from "@/components/ui/button";
import { supabase, toCamel, toSnake } from "@/lib/supabase";
import { Loader2, ArrowLeft, CalendarCheck2, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead } from "@shared/schema";

// Simple 30-min slots, 10a–4p, weekdays only, next 14 days
function generateSlots(): { dateKey: string; label: string; times: { iso: string; label: string }[] }[] {
  const days: ReturnType<typeof generateSlots> = [];
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const dateLabel = d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: tz,
    });
    const times = [];
    for (let hour = 10; hour < 16; hour++) {
      for (const minute of [0, 30]) {
        const slot = new Date(d);
        slot.setHours(hour, minute, 0, 0);
        times.push({
          iso: slot.toISOString(),
          label: slot.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
            timeZone: tz,
          }),
        });
      }
    }
    days.push({ dateKey: d.toISOString().slice(0, 10), label: dateLabel, times });
  }
  return days;
}

export default function IntakeBookPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = Number(params.leadId);
  const [, setLocation] = useLocation();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loadingLead, setLoadingLead] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(generateSlots, []);

  useEffect(() => {
    if (!leadId || Number.isNaN(leadId)) {
      setLoadingLead(false);
      return;
    }
    supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) {
          console.error("[book] fetch lead:", err);
          setError("Could not load your intake record. You can still book below.");
        } else if (data) {
          setLead(toCamel(data) as Lead);
        }
        setLoadingLead(false);
      });
  }, [leadId]);

  useEffect(() => {
    if (days.length && !selectedDay) setSelectedDay(days[0].dateKey);
  }, [days, selectedDay]);

  const timesForDay = days.find((d) => d.dateKey === selectedDay)?.times ?? [];

  const submit = async () => {
    if (!selectedSlot) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload = toSnake({
        leadId: lead?.id ?? null,
        entityId: lead?.entityId ?? "becs",
        type: "consult",
        title: `Free consult — ${lead?.name ?? "Intake lead"}`,
        scheduledAt: selectedSlot,
        duration: 30,
        status: "scheduled",
        notes: note.trim() || null,
      });
      const { error: err } = await supabase.from("meetings").insert(payload);
      if (err) throw err;
      setBooked(true);
    } catch (err: any) {
      console.error("[book] insert:", err);
      setError(err?.message || "Could not book. Try another time or email us directly.");
      setSubmitting(false);
    }
  };

  if (loadingLead) {
    return (
      <PublicPageShell>
        <div className="max-w-3xl mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      </PublicPageShell>
    );
  }

  if (booked) {
    const dt = selectedSlot ? new Date(selectedSlot) : null;
    return (
      <PublicPageShell>
        <section className="max-w-2xl mx-auto px-4 py-16 lg:py-24 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-[hsl(83,60%,57%)]/15 flex items-center justify-center">
            <CalendarCheck2 size={28} className="text-[hsl(83,60%,45%)]" />
          </div>
          <h1 className="mt-6 text-3xl lg:text-4xl font-bold text-slate-900">
            You're on the calendar.
          </h1>
          <p className="mt-4 text-slate-600">
            We've saved your consult
            {dt ? ` for ${dt.toLocaleString(undefined, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}` : ""}.
            You'll receive an email confirmation with the meeting link shortly.
          </p>
          <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-6 text-left text-sm space-y-2">
            <div className="font-semibold text-slate-900">What happens next</div>
            <ul className="space-y-1 text-slate-600">
              <li className="flex items-start gap-2"><Check size={14} className="text-[hsl(83,60%,45%)] mt-0.5" /> Brandon reviews your intake before the call.</li>
              <li className="flex items-start gap-2"><Check size={14} className="text-[hsl(83,60%,45%)] mt-0.5" /> We dig into your goals and current state on the 30-minute call.</li>
              <li className="flex items-start gap-2"><Check size={14} className="text-[hsl(83,60%,45%)] mt-0.5" /> You receive a tailored proposal within 2 business days.</li>
            </ul>
          </div>
          <Button
            className="mt-8 bg-[hsl(232,45%,18%)] hover:bg-[hsl(232,45%,12%)] text-white"
            onClick={() => setLocation("/intake")}
            data-testid="book-home"
          >
            Back to home
          </Button>
        </section>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell>
      <section className="max-w-3xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
        <button
          onClick={() => setLocation("/intake/form")}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6"
          data-testid="back-to-form"
        >
          <ArrowLeft size={14} /> Back to intake
        </button>

        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-[hsl(83,60%,45%)]">
            Intake · Step 2 of 2
          </div>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold text-slate-900">
            Book your free 30-minute consult.
          </h1>
          {lead?.name && (
            <p className="mt-3 text-slate-600">
              Thanks, {lead.name.split(" ")[0]}. Pick a time that works.
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-2.5">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Day strip */}
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {days.map((d) => (
                <button
                  key={d.dateKey}
                  onClick={() => {
                    setSelectedDay(d.dateKey);
                    setSelectedSlot(null);
                  }}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
                    selectedDay === d.dateKey
                      ? "bg-[hsl(232,45%,18%)] text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                  )}
                  data-testid={`day-${d.dateKey}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time grid */}
          <div className="p-4 lg:p-6">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
              <Clock size={12} />
              All times shown in your local timezone
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {timesForDay.map((t) => (
                <button
                  key={t.iso}
                  onClick={() => setSelectedSlot(t.iso)}
                  className={cn(
                    "py-2.5 text-sm font-medium rounded-lg border transition-colors",
                    selectedSlot === t.iso
                      ? "bg-[hsl(83,60%,57%)] border-[hsl(83,60%,57%)] text-[hsl(232,45%,18%)]"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-400"
                  )}
                  data-testid={`slot-${t.iso}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {selectedSlot && (
            <div className="border-t border-slate-200 p-4 lg:p-6 bg-slate-50 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Anything Brandon should know before the call?
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(83,60%,57%)] focus:border-transparent"
                  placeholder="Optional — context, questions, links…"
                  data-testid="booking-note"
                />
              </div>
              <Button
                onClick={submit}
                disabled={submitting}
                size="lg"
                className="w-full bg-[hsl(232,45%,18%)] hover:bg-[hsl(232,45%,12%)] text-white h-11 font-semibold"
                data-testid="confirm-booking"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={15} /> Booking…
                  </>
                ) : (
                  <>Confirm consult</>
                )}
              </Button>
            </div>
          )}
        </div>
      </section>
    </PublicPageShell>
  );
}
