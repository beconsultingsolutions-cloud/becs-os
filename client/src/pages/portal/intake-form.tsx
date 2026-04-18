import { useState } from "react";
import { useLocation } from "wouter";
import { PublicPageShell } from "@/lib/client-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase, toSnake } from "@/lib/supabase";
import { SERVICE_LABELS, SERVICE_TYPES, type ServiceType } from "@shared/schema";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

type FormState = {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  businessStage: string;
  serviceInterest: ServiceType | "";
  goals: string;
  painPoints: string;
  timeline: string;
  budgetComfort: string;
  referralSource: string;
};

const initial: FormState = {
  name: "",
  businessName: "",
  email: "",
  phone: "",
  businessStage: "",
  serviceInterest: "",
  goals: "",
  painPoints: "",
  timeline: "",
  budgetComfort: "",
  referralSource: "",
};

const BUSINESS_STAGES = [
  "Idea stage — exploring the concept",
  "Pre-launch — getting ready",
  "Recently launched — under 1 year",
  "Established — 1 to 3 years",
  "Scaling — 3+ years",
];

const TIMELINES = [
  "Ready to start now",
  "Within the next 30 days",
  "1-3 months",
  "3-6 months",
  "Just exploring",
];

const BUDGETS = [
  "Under $1,000",
  "$1,000 – $3,000",
  "$3,000 – $10,000",
  "$10,000 – $25,000",
  "$25,000+",
  "Not sure yet",
];

export default function IntakeFormPage() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<FormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = toSnake({
        entityId: "becs",
        name: form.name.trim(),
        businessName: form.businessName.trim() || null,
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        businessStage: form.businessStage || null,
        serviceInterest: form.serviceInterest || null,
        goals: form.goals.trim() || null,
        painPoints: form.painPoints.trim() || null,
        timeline: form.timeline || null,
        budgetComfort: form.budgetComfort || null,
        referralSource: form.referralSource.trim() || null,
        status: "new",
      });
      // leadId is generated server-side via default or admin; public insert relies on RLS policy
      payload.lead_id = `L-${Date.now().toString(36).toUpperCase()}`;

      const { data, error: insertErr } = await supabase
        .from("leads")
        .insert(payload)
        .select("id")
        .single();

      if (insertErr) throw insertErr;
      if (!data?.id) throw new Error("Submission failed.");

      setLocation(`/intake/book/${data.id}`);
    } catch (err: any) {
      console.error("[intake] submit failed:", err);
      setError(err?.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const canSubmit = form.name && form.email && form.serviceInterest;

  return (
    <PublicPageShell>
      <section className="max-w-3xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
        <button
          onClick={() => setLocation("/intake")}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6"
          data-testid="back-to-intake"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-[hsl(83,60%,45%)]">
            Intake · Step 1 of 2
          </div>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold text-slate-900">
            Tell us about your business.
          </h1>
          <p className="mt-3 text-slate-600">
            Takes about 3 minutes. Everything stays between you and Brandon.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6"
          data-testid="intake-form"
        >
          {/* About you */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              About you
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Your name" required>
                <Input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Jane Doe"
                  required
                  data-testid="input-name"
                />
              </Field>
              <Field label="Business name">
                <Input
                  value={form.businessName}
                  onChange={(e) => update("businessName", e.target.value)}
                  placeholder="Acme LLC"
                  data-testid="input-business"
                />
              </Field>
              <Field label="Email" required>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@example.com"
                  required
                  data-testid="input-email"
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="(555) 555-5555"
                  data-testid="input-phone"
                />
              </Field>
            </div>
          </div>

          {/* Where you are */}
          <div className="pt-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Where you are
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Business stage">
                <Select value={form.businessStage} onValueChange={(v) => update("businessStage", v)}>
                  <SelectTrigger data-testid="select-stage">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Which service interests you?" required>
                <Select
                  value={form.serviceInterest}
                  onValueChange={(v) => update("serviceInterest", v as ServiceType)}
                >
                  <SelectTrigger data-testid="select-service">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SERVICE_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          {/* Your goals */}
          <div className="pt-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              What you're trying to solve
            </div>
            <div className="space-y-4">
              <Field label="Goals — what does success look like?">
                <Textarea
                  value={form.goals}
                  onChange={(e) => update("goals", e.target.value)}
                  rows={3}
                  placeholder="In 6 months I want to…"
                  data-testid="textarea-goals"
                />
              </Field>
              <Field label="Biggest pain points or blockers right now">
                <Textarea
                  value={form.painPoints}
                  onChange={(e) => update("painPoints", e.target.value)}
                  rows={3}
                  placeholder="What's stopping you from getting there?"
                  data-testid="textarea-pain"
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Timeline">
                  <Select value={form.timeline} onValueChange={(v) => update("timeline", v)}>
                    <SelectTrigger data-testid="select-timeline">
                      <SelectValue placeholder="When do you want to start?" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMELINES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Budget comfort">
                  <Select value={form.budgetComfort} onValueChange={(v) => update("budgetComfort", v)}>
                    <SelectTrigger data-testid="select-budget">
                      <SelectValue placeholder="Ballpark range" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUDGETS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="How did you hear about BECS?">
                <Input
                  value={form.referralSource}
                  onChange={(e) => update("referralSource", e.target.value)}
                  placeholder="Referral, Google, social…"
                  data-testid="input-referral"
                />
              </Field>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-2.5">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-[hsl(83,60%,45%)]" />
              Private and secure
            </div>
            <Button
              type="submit"
              disabled={!canSubmit || submitting}
              size="lg"
              className="bg-[hsl(232,45%,18%)] hover:bg-[hsl(232,45%,12%)] text-white px-6 h-11 font-semibold"
              data-testid="submit-intake"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={15} /> Saving…
                </>
              ) : (
                <>
                  Continue to booking <ArrowRight size={15} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </section>
    </PublicPageShell>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
