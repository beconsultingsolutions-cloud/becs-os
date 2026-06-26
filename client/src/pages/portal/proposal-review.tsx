/**
 * /p/:token — Public proposal review page.
 *
 * Renders the canonical Master Proposal layout (Notion BECS Master Proposal
 * Template) using the MasterDocRenderer, with a signature appendix below the
 * sections. Falls back to the legacy compact layout only when the proposal
 * record is missing or the token is invalid.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "wouter";
import { PublicPageShell } from "@/lib/client-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, toCamel } from "@/lib/supabase";
import { SERVICE_LABELS, type ServiceType, type Proposal } from "@shared/schema";
import { Loader2, CheckCircle2, XCircle, PenLine } from "lucide-react";

import MasterDocRenderer from "@/components/master-doc/MasterDocRenderer";
import {
  getMasterDoc,
  type TokenMap,
} from "@/lib/master-doc-registry";

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
    ctx.strokeStyle = "#1e1c5a";
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

  // Build token map from the proposal record.
  const tokens: TokenMap = useMemo(() => {
    if (!proposal) return {};
    const priceFmt =
      typeof proposal.price === "number"
        ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(proposal.price)
        : "TBD";
    const serviceLabel =
      SERVICE_LABELS[proposal.serviceType as ServiceType] ?? proposal.serviceType ?? "Engagement";
    return {
      CLIENT_NAME: proposal.title || "Client",
      CLIENT_LOCATION: "—",
      CLIENT_BUSINESS_TYPE: serviceLabel,
      INDUSTRY: serviceLabel,
      INDUSTRY_ALT: proposal.ndaRequired ? " (with mutual NDA)" : "",
      RETAINER_PRICE: priceFmt,
      HERO_HEADLINE: proposal.title ? `A plan to <em>move</em> ${escapeHtml(proposal.title)} forward` : "A clear plan, built to <em>execute</em>",
      HERO_SUBLINE: proposal.scope?.split("\n")[0]?.slice(0, 240) ||
        "BE Consulting Solutions — diagnose the real problem, build the system, hand off the operation.",
      EFFECTIVE_DATE: new Date(proposal.createdAt || Date.now()).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      }),
      DEPOSIT_AMOUNT: "50% of total investment",
      SERVICE_NAME: serviceLabel,
      SOW_REFERENCE: serviceLabel,
    };
  }, [proposal]);

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

  const doc = getMasterDoc("proposal-canonical");

  // If the proposal has admin-authored body fields, override their
  // corresponding registry sections so the renderer shows the live content.
  const docWithOverrides = useMemo(() => {
    if (!proposal) return doc;
    const overrides: Partial<Record<string, string>> = {};
    if (proposal.scope) overrides["pr-problem"] = `<p style="white-space:pre-line">${escapeHtml(proposal.scope)}</p>`;
    if (proposal.deliverables) {
      overrides["pr-success"] = `<p>By the end of this engagement, ${escapeHtml(proposal.title)} will have:</p><p style="white-space:pre-line">${escapeHtml(proposal.deliverables)}</p>`;
    }
    if (proposal.timeline) {
      overrides["pr-timeline"] = `<p style="white-space:pre-line">${escapeHtml(proposal.timeline)}</p>`;
    }
    if (proposal.includedMeetings) {
      overrides["pr-roles"] = `<p><strong>Included meetings &amp; cadence:</strong></p><p style="white-space:pre-line">${escapeHtml(proposal.includedMeetings)}</p>`;
    }
    if (Object.keys(overrides).length === 0) return doc;
    return {
      ...doc,
      sections: doc.sections.map((s) =>
        overrides[s.id] ? { ...s, body: overrides[s.id]! } : s
      ),
    };
  }, [doc, proposal]);

  return (
    <PublicPageShell>
      <MasterDocRenderer
        doc={docWithOverrides}
        tokens={tokens}
        appendix={
          <section
            className="md-section"
            id="pr-sign"
            data-testid="md-section-pr-sign"
          >
            <header className="md-section-head">
              <div className="md-section-num-badge teal">
                <PenLine size={22} />
              </div>
              <div className="md-section-titles">
                <div className="md-section-eyebrow">Sign</div>
                <h2 className="md-section-title">Review and Sign</h2>
              </div>
            </header>
            <div className="md-section-body">
              {signed ? (
                <div className="text-center py-6">
                  <div className="mx-auto w-12 h-12 rounded-full bg-[#e1f5ee] flex items-center justify-center">
                    <CheckCircle2 size={24} className="text-[#0F6E56]" />
                  </div>
                  <h3 className="mt-4 text-2xl font-bold" style={{ color: "#1e1c5a" }}>
                    Accepted — thank you.
                  </h3>
                  <p className="mt-2 text-slate-600 text-sm">
                    Brandon has been notified and will reach out to kick off next steps.
                  </p>
                </div>
              ) : (
                <>
                  <p>
                    Add your name, email, and signature below to accept this proposal. You'll
                    receive a copy via email along with next steps.
                  </p>
                  <div className="mt-5 grid sm:grid-cols-2 gap-4">
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

                  <div className="mt-5">
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
                      className="mt-0.5 w-4 h-4 rounded border-slate-300"
                      style={{ accentColor: "#1D9E75" }}
                      data-testid="accept-checkbox"
                    />
                    <span>
                      I accept the terms of this proposal and authorize BE Consulting Solutions
                      to begin work on the described scope.
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
                    className="mt-6 w-full font-semibold h-11 text-white"
                    style={{ backgroundColor: "#1D9E75" }}
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
        }
      />
    </PublicPageShell>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
