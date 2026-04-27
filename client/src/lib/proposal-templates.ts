// ─── Proposal Package Templates ──────────────────────────────────────────────
// Pre-built proposal payloads tied to the PLAN / EVOLVE / SUCCEED P.E.S. modes.
// One-click prefill in the New Proposal dialog so admins can spin up a
// proposal in seconds instead of typing every field.
//
// Each template maps cleanly onto the proposals table fields:
//   title, serviceType, scope, price, timeline, deliverables (CSV), ndaRequired
// plus a `mode` tag used to auto-suggest a template based on the lead's tag.
//
// Pricing reflects the BECS service tiers documented on the marketing site:
//   PLAN Blueprint — $3K-$8K
//   EVOLVE Build — $15K-$40K (featured)
//   SUCCEED Care — $1K-$4K/mo
// We default to the mid-point of each band so the admin can adjust per deal.

import type { ServiceType } from "@shared/schema";

export type ProgramMode = "plan" | "evolve" | "succeed";

export interface ProposalTemplate {
  /** Stable key used in the picker UI. */
  key: string;
  /** Display name in the picker. */
  label: string;
  /** Short blurb shown under the label. */
  blurb: string;
  /** Which P.E.S. mode this maps to — drives auto-suggest. */
  mode: ProgramMode;
  /** Whether this is one of the three flagship packages (shown first). */
  flagship: boolean;
  /** Prefill values for the New Proposal dialog. */
  prefill: {
    title: string;
    serviceType: ServiceType;
    scope: string;
    /** Default price as a number (mid-point of the tier band). */
    price: number;
    timeline: string;
    /** Comma-separated string matching the existing form input. */
    deliverables: string;
    ndaRequired: boolean;
  };
}

// ─── Helper: build a deliverables CSV from an array ──────────────────────────
const csv = (items: string[]) => items.join(", ");

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  // ─── 1. PLAN — Blueprint ────────────────────────────────────────────────
  {
    key: "plan_blueprint",
    label: "PLAN — Blueprint",
    blurb: "Strategic foundation: clarity, market validation, financial structure.",
    mode: "plan",
    flagship: true,
    prefill: {
      title: "P.E.S. Blueprint — Strategic Foundation",
      serviceType: "foundation_builder",
      scope:
        "A focused 2–3 week engagement to clarify your brand, validate your market, and structure your financial foundation. You walk away with a complete strategic blueprint your team or partners can execute against — no more guessing, no more starting over every quarter.",
      price: 5500,
      timeline: "2–3 weeks",
      deliverables: csv([
        "P.E.S. Strategy Session (90 min deep-dive)",
        "Brand Messaging Guide + One-Liner",
        "Market Validation Report",
        "Financial Allocation Plan",
        "3 Audience Persona Profiles",
        "Pricing Matrix + Offer Stack",
      ]),
      ndaRequired: false,
    },
  },

  // ─── 2. EVOLVE — Build (featured) ───────────────────────────────────────
  {
    key: "evolve_build",
    label: "EVOLVE — Build",
    blurb: "Build & launch readiness: brand identity, automation, ops infrastructure.",
    mode: "evolve",
    flagship: true,
    prefill: {
      title: "P.E.S. Build — Brand & Operations Engine",
      serviceType: "business_launch",
      scope:
        "A 4–6 week build phase that turns your blueprint into a working business engine. We design your brand identity, set up your automation stack, structure your operational workflows, and integrate your financial systems so the business runs without you micromanaging every detail.",
      price: 27500,
      timeline: "4–6 weeks",
      deliverables: csv([
        "Complete Brand Identity Kit",
        "Operations Workflow SOP Manual",
        "Automated Marketing Funnel",
        "Sales Page Copy + Offer Positioning",
        "PM System Templates + SOPs",
        "Financial Dashboard + Profit Review Template",
        "Complete 90-Day Launch Plan",
      ]),
      ndaRequired: true,
    },
  },

  // ─── 3. SUCCEED — Care (retainer) ───────────────────────────────────────
  {
    key: "succeed_care",
    label: "SUCCEED — Care",
    blurb: "Monthly growth retainer: marketing systems, optimization, KPI reviews.",
    mode: "succeed",
    flagship: true,
    prefill: {
      title: "P.E.S. Care — Growth & Optimization Retainer",
      serviceType: "retainer",
      scope:
        "A monthly retainer for businesses ready to scale. We run your launch marketing, manage your content and email systems, optimize paid campaigns, and review your KPIs and Profit First allocations every month so growth stays predictable and profitable.",
      price: 2500,
      timeline: "Monthly retainer (3-month minimum)",
      deliverables: csv([
        "60-Day Launch Marketing Plan",
        "Monthly Content Calendar + Templates",
        "Email Funnel Management (6–12 emails/mo)",
        "Paid Ads Setup + Optimization",
        "KPI Dashboard with Monthly Review",
        "Profit First Monthly Review",
        "Quarterly Growth Plan Session",
      ]),
      ndaRequired: false,
    },
  },

  // ─── 4. Combined: Foundation Pathway (PLAN + EVOLVE) ────────────────────
  {
    key: "foundation_pathway",
    label: "Foundation Pathway (PLAN + EVOLVE)",
    blurb: "For new entrepreneurs who need both clarity and infrastructure in one engagement.",
    mode: "evolve",
    flagship: false,
    prefill: {
      title: "P.E.S. Foundation Pathway — Clarity + Build",
      serviceType: "accelerator",
      scope:
        "Combined PLAN + EVOLVE engagement for early-stage founders who need to go from idea to launch-ready in a single, coherent push. Strategic blueprint, brand identity, automation stack, and operational systems delivered as one continuous program.",
      price: 32000,
      timeline: "6–8 weeks",
      deliverables: csv([
        "Everything in PLAN Blueprint",
        "Everything in EVOLVE Build",
        "Combined kickoff and unified delivery timeline",
        "Single point of strategic ownership across both phases",
      ]),
      ndaRequired: true,
    },
  },

  // ─── 5. Complete Transformation (PLAN + EVOLVE + SUCCEED 3 mo) ──────────
  {
    key: "complete_transformation",
    label: "Complete Transformation",
    blurb: "PLAN + EVOLVE + 3 months of SUCCEED. Full launch-to-traction program.",
    mode: "succeed",
    flagship: false,
    prefill: {
      title: "P.E.S. Complete Transformation Program",
      serviceType: "accelerator",
      scope:
        "End-to-end transformation: strategic foundation, full build, then 3 months of SUCCEED retainer to drive launch traction. Designed for committed founders who want one partner from clarity through revenue.",
      price: 39500,
      timeline: "10–14 weeks (then optional retainer continuation)",
      deliverables: csv([
        "Everything in PLAN Blueprint",
        "Everything in EVOLVE Build",
        "3 months of SUCCEED Care retainer",
        "Quarterly executive review + growth plan",
        "Priority strategic support across all phases",
      ]),
      ndaRequired: true,
    },
  },

  // ─── 6. Reality Check (entry point) ─────────────────────────────────────
  {
    key: "reality_check",
    label: "P.E.S. Reality Check",
    blurb: "90-minute diagnostic. Low-friction entry for new leads.",
    mode: "plan",
    flagship: false,
    prefill: {
      title: "P.E.S. Reality Check — 90-Minute Diagnostic",
      serviceType: "reality_check",
      scope:
        "A 90-minute live diagnostic across all three P.E.S. lenses (Plan, Evolve, Succeed) followed by a written snapshot report with your top three priority actions and a recommended next-step service path.",
      price: 497,
      timeline: "1 week (intake + session + report)",
      deliverables: csv([
        "Pre-session intake review",
        "90-minute live diagnostic session",
        "Written P.E.S. Snapshot Report",
        "Recommended next-step service path",
      ]),
      ndaRequired: false,
    },
  },

  // ─── 7. Strategy & Operations Session ───────────────────────────────────
  {
    key: "strategy_ops_session",
    label: "Strategy & Operations Session",
    blurb: "Single-day deep dive for founders who already have a plan but need execution.",
    mode: "evolve",
    flagship: false,
    prefill: {
      title: "Strategy & Operations Session",
      serviceType: "strategy_ops_session",
      scope:
        "A focused full-day strategy and operations session for founders who already know their direction but need to unblock execution. We map current workflows, identify the highest-leverage operational changes, and leave you with a 30-day implementation plan.",
      price: 2200,
      timeline: "1 week (prep + session + plan)",
      deliverables: csv([
        "Pre-session ops audit questionnaire",
        "Full-day live strategy + ops session",
        "Workflow map (current vs. target state)",
        "30-day implementation plan",
      ]),
      ndaRequired: false,
    },
  },

  // ─── 8. Brand Identity & Positioning (standalone) ───────────────────────
  {
    key: "brand_identity",
    label: "Brand Identity & Positioning",
    blurb: "Standalone brand sprint for clients who only need brand work.",
    mode: "evolve",
    flagship: false,
    prefill: {
      title: "Brand Identity & Positioning Sprint",
      serviceType: "brand_identity",
      scope:
        "A 3–4 week brand sprint covering positioning, messaging, and the complete visual identity system. Output is a brand identity kit your team can use across every customer touchpoint.",
      price: 6500,
      timeline: "3–4 weeks",
      deliverables: csv([
        "Brand positioning + messaging architecture",
        "Logo suite (primary, secondary, mark)",
        "Color palette + typography system",
        "Brand style guide (PDF)",
        "Brand asset library (Drive folder)",
      ]),
      ndaRequired: false,
    },
  },

  // ─── 9. Compliance Coaching ─────────────────────────────────────────────
  {
    key: "compliance_coaching",
    label: "Compliance Coaching",
    blurb: "Specialized retainer: legal, compliance, and operational risk coaching.",
    mode: "succeed",
    flagship: false,
    prefill: {
      title: "B.A.S Compliance Coaching",
      serviceType: "compliance_coaching",
      scope:
        "Monthly coaching engagement for founders who need ongoing compliance, legal, and operational risk guidance. Includes a monthly review call, a documented compliance checklist, and on-demand support between sessions.",
      price: 1500,
      timeline: "Monthly retainer (3-month minimum)",
      deliverables: csv([
        "Monthly 60-min coaching call",
        "Compliance + risk checklist (refreshed monthly)",
        "On-demand email support between sessions",
        "Quarterly compliance health score",
      ]),
      ndaRequired: true,
    },
  },
];

/**
 * Find templates that match a lead's mode tag.
 * Returns the flagship template for that mode first, then any others.
 */
export function suggestTemplates(mode: string | null | undefined): ProposalTemplate[] {
  if (!mode) return PROPOSAL_TEMPLATES;
  const normalized = mode.toLowerCase() as ProgramMode;
  const matching = PROPOSAL_TEMPLATES.filter((t) => t.mode === normalized);
  if (matching.length === 0) return PROPOSAL_TEMPLATES;
  // Flagship first, then by price ascending
  return [...matching].sort((a, b) => {
    if (a.flagship !== b.flagship) return a.flagship ? -1 : 1;
    return a.prefill.price - b.prefill.price;
  });
}

/** Look up a template by key. */
export function getTemplate(key: string): ProposalTemplate | undefined {
  return PROPOSAL_TEMPLATES.find((t) => t.key === key);
}

/** Just the three flagship templates, in PLAN → EVOLVE → SUCCEED order. */
export const FLAGSHIP_TEMPLATES = PROPOSAL_TEMPLATES.filter((t) => t.flagship);
