import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { PublicPageShell } from "@/lib/client-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, toCamel } from "@/lib/supabase";
import { SERVICE_LABELS, type ServiceType, type Proposal } from "@shared/schema";
import {
  Loader2,
  CheckCircle2,
  FileText,
  Clock,
  Package,
  ShieldCheck,
  XCircle,
  PenLine,
} from "lucide-react";

export default function ProposalReviewPage() {
  const { token } = useParams<{ token: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasStrokes = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!token) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    supabase
      .from("proposals")
      .select("*")
      .eq("share_token", token)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setNotFound(true);
        } else {
          const p = toCamel(data) as Proposal;
          setProposal(p);
          if (p.status === "accepted") setSigned(true);
        }
        setLoading(false);
      });
  }, [token]);

  const clearSignature = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx?.clearRect(0, 0, c.width, c.height);
    hasStrokes.current = false;
  };

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (c.width / rect.width),
      y: (e.clientY - rect.top) * (c.height / rect.height),
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    lastPoint.current = getPoint(e);
    hasStrokes.current = true;
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !lastPoint.current) return;
    const p = getPoint(e);
    ctx.strokeStyle = "hsl(232,45%,18%)";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPoint.current = p;
  };

  const endDraw = () => {
    drawing.current = false;
    lastPoint.current = null;
  };

  const sign = async () => {
    if (!proposal) return;
    if (!signerName.trim() || !signerEmail.trim() || !accepted || !hasStrokes.current) {
      setError("Complete name, email, signature, and acceptance to sign.");
      return;
    }
    setError(null);
    setSigning(true);
    try {
      const sigDataUrl = canvasRef.current?.toDataURL("image/png") ?? null;
      const { error: sigErr } = await supabase.from("proposal_signatures").insert({
        proposal_id: proposal.id,
        signer_name: signerName.trim(),
        signer_email: signerEmail.trim(),
        signature_data_url: sigDataUrl,
        accepted_terms: true,
        user_agent: navigator.userAgent,
      });
      if (sigErr) throw sigErr;

      // Best-effort: try to mark the proposal accepted via RLS. If this fails we still
      // consider the signature captured because the signature row is the legal record.
      await supabase
        .from("proposals")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", proposal.id);

      setSigned(true);
    } catch (err: any) {
      console.error("[proposal-review] sign:", err);
      setError(err?.message || "Could not record signature. Please try again.");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <PublicPageShell>
        <div className="max-w-3xl mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      </PublicPageShell>
    );
  }

  if (notFound || !proposal) {
    return (
      <PublicPageShell>
        <section className="max-w-xl mx-auto px-4 py-20 text-center">
          <XCircle className="mx-auto text-slate-300" size={40} />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Proposal not found</h1>
          <p className="mt-2 text-slate-600 text-sm">
            This link may have expired or been revoked. Reach out to Brandon for a new link.
          </p>
        </section>
      </PublicPageShell>
    );
  }

  const service = SERVICE_LABELS[proposal.serviceType as ServiceType] ?? proposal.serviceType;
  const price =
    typeof proposal.price === "number"
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(proposal.price)
      : null;

  return (
    <PublicPageShell>
      <section className="max-w-3xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
        {/* Header card */}
        <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200">
          <div className="bg-[hsl(232,45%,18%)] text-white p-6 lg:p-8">
            <div className="inline-flex items-center gap-2 bg-white/10 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
              <FileText size={12} /> Proposal
            </div>
            <h1 className="mt-4 text-3xl lg:text-4xl font-bold leading-tight">{proposal.title}</h1>
            <div className="mt-3 text-sm text-white/70">
              {service} · Prepared by BE Consulting Solutions
            </div>
            {price && (
              <div className="mt-6 inline-flex items-baseline gap-1.5 bg-[hsl(83,60%,57%)] text-[hsl(232,45%,18%)] px-4 py-2 rounded-lg">
                <span className="text-xs font-semibold uppercase tracking-wider">Investment</span>
                <span className="ml-2 text-xl font-bold">{price}</span>
              </div>
            )}
          </div>

          <div className="bg-white p-6 lg:p-8 space-y-6">
            {proposal.scope && (
              <Section icon={<FileText size={16} />} title="Scope">
                <p className="whitespace-pre-line">{proposal.scope}</p>
              </Section>
            )}

            {proposal.timeline && (
              <Section icon={<Clock size={16} />} title="Timeline">
                <p className="whitespace-pre-line">{proposal.timeline}</p>
              </Section>
            )}

            {proposal.deliverables && (
              <Section icon={<Package size={16} />} title="Deliverables">
                <p className="whitespace-pre-line">{proposal.deliverables}</p>
              </Section>
            )}

            {proposal.includedMeetings && (
              <Section icon={<CheckCircle2 size={16} />} title="Included meetings">
                <p className="whitespace-pre-line">{proposal.includedMeetings}</p>
              </Section>
            )}

            {proposal.ndaRequired && (
              <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
                <ShieldCheck size={16} className="text-[hsl(83,60%,45%)] flex-shrink-0 mt-0.5" />
                <div className="text-slate-600">
                  This engagement requires a mutual NDA. We'll send it for signature before kickoff.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sign block */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm">
          {signed ? (
            <div className="text-center py-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-[hsl(83,60%,57%)]/15 flex items-center justify-center">
                <CheckCircle2 size={24} className="text-[hsl(83,60%,45%)]" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-slate-900">Accepted — thank you.</h2>
              <p className="mt-2 text-slate-600 text-sm">
                Brandon has been notified and will reach out to kick off next steps.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[hsl(83,60%,45%)]">
                <PenLine size={14} /> Review and sign
              </div>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Ready to move forward?</h2>
              <p className="mt-2 text-slate-600 text-sm">
                Add your name, email, and signature to accept this proposal. You'll receive a copy
                via email along with next steps.
              </p>

              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Full name</Label>
                  <Input
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Jane Doe"
                    data-testid="sign-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Email</Label>
                  <Input
                    type="email"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    placeholder="you@example.com"
                    data-testid="sign-email"
                  />
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Draw signature</Label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-xs text-slate-500 hover:text-slate-900 underline underline-offset-2"
                    data-testid="clear-signature"
                  >
                    Clear
                  </button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={180}
                  className="w-full h-[180px] border-2 border-dashed border-slate-300 rounded-lg bg-white touch-none"
                  onPointerDown={startDraw}
                  onPointerMove={draw}
                  onPointerUp={endDraw}
                  onPointerLeave={endDraw}
                  data-testid="signature-canvas"
                />
              </div>

              <label className="mt-4 flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[hsl(83,60%,57%)] focus:ring-[hsl(83,60%,57%)]"
                  data-testid="accept-checkbox"
                />
                <span>
                  I accept the terms of this proposal and authorize BE Consulting Solutions to begin
                  work on the described scope.
                </span>
              </label>

              {error && (
                <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-2.5">
                  {error}
                </div>
              )}

              <Button
                onClick={sign}
                disabled={signing}
                size="lg"
                className="mt-6 w-full bg-[hsl(83,60%,57%)] hover:bg-[hsl(83,60%,50%)] text-[hsl(232,45%,18%)] font-semibold h-11"
                data-testid="sign-submit"
              >
                {signing ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={15} /> Recording signature…
                  </>
                ) : (
                  <>Accept and sign</>
                )}
              </Button>
            </>
          )}
        </div>
      </section>
    </PublicPageShell>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
        {icon}
        {title}
      </div>
      <div className="text-sm text-slate-700 leading-relaxed">{children}</div>
    </div>
  );
}
