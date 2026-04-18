// ─── Service Templates ────────────────────────────────────────────────────────
// Single source of truth for every BE Consulting service offering.
// Used by training modules, setup guides, and project scaffolding.

import type { OnboardingPhase } from "@shared/schema";

export interface ServiceMilestone {
  title: string;
  description: string;
}

export interface ServiceOnboardingPhase {
  phase: OnboardingPhase;
  items: string[];
}

export interface ServiceLegalDoc {
  type: string;
  required: boolean;
  note?: string;
}

export interface ServiceTemplate {
  key: string;
  name: string;
  tagline: string;
  price: string;
  paymentNote?: string;
  duration: string;
  meetingsIncluded: string;
  deliverables: string[];
  milestones: ServiceMilestone[];
  onboarding: ServiceOnboardingPhase[];
  legalDocs: ServiceLegalDoc[];
}

export const SERVICE_TEMPLATES: ServiceTemplate[] = [
  // ─── 1. P.E.S. Reality Check ───────────────────────────────────────────────
  {
    key: "reality_check",
    name: "P.E.S. Reality Check",
    tagline: "Diagnose your business from every angle — in 90 focused minutes.",
    price: "$497",
    duration: "90 minutes",
    meetingsIncluded: "1",
    deliverables: [
      "Pre-session intake questionnaire review",
      "90-minute live diagnostic session (video or in-person)",
      "Written P.E.S. Snapshot report — strengths, gaps, and priority actions",
      "Recommended next-step service path",
    ],
    milestones: [
      {
        title: "Pre-Session Intake Complete",
        description:
          "Client completes the diagnostic questionnaire covering current business state, goals, pain points, and financials. Admin reviews and flags key themes before the session.",
      },
      {
        title: "90-Minute Diagnostic Session",
        description:
          "Live session covering all three P.E.S. lenses: Plan (strategy & clarity), Evolve (systems & operations), Succeed (revenue & growth). Admin documents key findings in real time.",
      },
      {
        title: "P.E.S. Snapshot Report Delivered",
        description:
          "Admin generates the written report summarizing diagnostic findings, top three priority actions, and the recommended next engagement path. Report is uploaded to the client portal.",
      },
    ],
    onboarding: [
      {
        phase: "compliance",
        items: [
          "SOW signed and payment collected",
          "Intake questionnaire link sent to client",
        ],
      },
      {
        phase: "clarity",
        items: [
          "Confirm session date, time, and video link",
          "Review intake questionnaire responses before session",
        ],
      },
      {
        phase: "culture",
        items: ["Introduce P.E.S. methodology framing at session start"],
      },
      {
        phase: "connection",
        items: [
          "Send follow-up email with report and next-step offer within 24 hours",
        ],
      },
      {
        phase: "checkback",
        items: ["30-day follow-up check-in to see if client acted on report"],
      },
    ],
    legalDocs: [
      {
        type: "sow",
        required: true,
        note: "Single-session SOW covering scope, deliverables, and IP ownership of report",
      },
    ],
  },

  // ─── 2. Foundation Builder ─────────────────────────────────────────────────
  {
    key: "foundation_builder",
    name: "Foundation Builder",
    tagline:
      "Build the operating foundation your business needs to scale with confidence.",
    price: "$2,497",
    duration: "4–6 weeks",
    meetingsIncluded: "Weekly 1:1s",
    deliverables: [
      "Business model and revenue clarity audit",
      "Standard operating procedures (SOPs) for 3 core processes",
      "90-day action roadmap",
      "Branded one-page business overview document",
      "Weekly session recaps with action items",
    ],
    milestones: [
      {
        title: "Discovery & Baseline Assessment",
        description:
          "First session: map current business state, revenue streams, team structure, and top bottlenecks. Establish baseline metrics and goal posts for the engagement.",
      },
      {
        title: "Business Model Clarity",
        description:
          "Define or refine the core offer, ideal client profile, and pricing logic. Resolve any structural misalignments before building operational layers.",
      },
      {
        title: "Process Documentation (SOPs)",
        description:
          "Document three core operating processes (e.g., client intake, fulfillment, follow-up). Client reviews and approves draft SOPs.",
      },
      {
        title: "90-Day Action Roadmap Built",
        description:
          "Collaboratively build a prioritized 90-day roadmap with weekly milestones, owner assignments, and success metrics.",
      },
      {
        title: "Final Review & Handoff",
        description:
          "Closing session: review all deliverables, confirm client can operate independently, complete the one-page business overview, and confirm portal access is active.",
      },
    ],
    onboarding: [
      {
        phase: "compliance",
        items: [
          "SOW signed and payment collected",
          "NDA executed if client data is sensitive",
        ],
      },
      {
        phase: "clarity",
        items: [
          "Send pre-engagement questionnaire",
          "Schedule recurring weekly session cadence",
          "Grant client portal access",
        ],
      },
      {
        phase: "culture",
        items: [
          "Welcome message delivered via portal",
          "Explain weekly session format and recap process",
        ],
      },
      {
        phase: "connection",
        items: [
          "Introduce preferred communication channel (email vs. portal messaging)",
          "Share resource folder with SOW and initial templates",
        ],
      },
      {
        phase: "checkback",
        items: [
          "Week 2 pulse check — confirm pacing and expectations are aligned",
        ],
      },
    ],
    legalDocs: [
      {
        type: "sow",
        required: true,
        note: "Multi-week SOW covering scope, deliverable list, timeline, and revision policy",
      },
      {
        type: "nda",
        required: false,
        note: "Recommended if client shares proprietary financials or trade secrets",
      },
    ],
  },

  // ─── 3. P.E.S. Business Launch ────────────────────────────────────────────
  {
    key: "business_launch",
    name: "P.E.S. Business Launch",
    tagline:
      "Your complete 90-day transformation from concept to fully operational business.",
    price: "$5,495",
    paymentNote: "2 × $2,850 available",
    duration: "90 days",
    meetingsIncluded: "Weekly 1:1s",
    deliverables: [
      "Full P.E.S. business launch blueprint",
      "Legal structure and entity setup guidance",
      "Brand identity starter kit (name, tagline, positioning statement)",
      "Core offer design and pricing structure",
      "Operational playbook (SOPs, tools, workflows)",
      "Sales and outreach scripts",
      "90-day post-launch action roadmap",
      "Weekly session recaps with milestones",
    ],
    milestones: [
      {
        title: "Phase 1 — PLAN: Business Blueprint",
        description:
          "Weeks 1–2: Define the business concept, legal structure, mission, vision, and target market. Complete the P.E.S. Business Launch Blueprint document.",
      },
      {
        title: "Phase 2 — PLAN: Brand & Offer Design",
        description:
          "Weeks 3–4: Name, tagline, core offer, pricing model, and positioning statement. Client approves all brand foundation elements before moving forward.",
      },
      {
        title: "Phase 3 — EVOLVE: Operations Setup",
        description:
          "Weeks 5–7: Build the operational backbone — tools, SOPs, client intake process, and fulfillment workflow. Confirm systems are functional end-to-end.",
      },
      {
        title: "Phase 4 — EVOLVE: Sales Infrastructure",
        description:
          "Weeks 8–10: Develop outreach strategy, sales scripts, proposal template, and follow-up cadence. Role-play discovery and close scenarios.",
      },
      {
        title: "Phase 5 — SUCCEED: Launch Execution",
        description:
          "Weeks 11–12: Soft launch to warm network, execute first outreach campaign, conduct first sales conversations. Track results and iterate.",
      },
      {
        title: "Phase 6 — SUCCEED: 90-Day Debrief & Next Step",
        description:
          "Final session: review launch results, assess what's working, deliver the post-launch roadmap, and present options for continued growth support.",
      },
    ],
    onboarding: [
      {
        phase: "compliance",
        items: [
          "SOW signed and first payment ($2,850) collected",
          "NDA executed",
          "Payment authorization on file for installment 2",
        ],
      },
      {
        phase: "clarity",
        items: [
          "Send Business Launch intake questionnaire",
          "Schedule weekly recurring sessions for 90 days",
          "Grant client portal access and walk through portal features",
        ],
      },
      {
        phase: "culture",
        items: [
          "Send welcome packet: what to expect, how to show up, accountability norms",
          "Explain P.E.S. (Plan → Evolve → Succeed) methodology framing for the engagement",
        ],
      },
      {
        phase: "connection",
        items: [
          "Assign dedicated consultant and confirm communication preferences",
          "Schedule monthly milestone review checkpoints in addition to weekly sessions",
        ],
      },
      {
        phase: "checkback",
        items: [
          "30-day progress review — confirm client is on track and address early blockers",
          "60-day mid-point debrief — reassess goals and adjust roadmap if needed",
        ],
      },
    ],
    legalDocs: [
      {
        type: "sow",
        required: true,
        note: "Full-engagement SOW covering 90-day scope, milestone delivery schedule, and revision limits",
      },
      {
        type: "nda",
        required: true,
        note: "Required — client will share sensitive business concepts and financials throughout the engagement",
      },
      {
        type: "payment_authorization",
        required: true,
        note: "Authorizes the second installment of $2,850 to be collected at the 45-day mark",
      },
    ],
  },

  // ─── 4. Strategy & Operations Session ─────────────────────────────────────
  {
    key: "strategy_ops_session",
    name: "Strategy & Operations Session",
    tagline:
      "One targeted session to solve a specific strategic or operational challenge.",
    price: "$995",
    duration: "90 minutes",
    meetingsIncluded: "1",
    deliverables: [
      "Pre-session agenda co-created with client",
      "90-minute focused working session",
      "Session recap with action items and decisions made",
      "Optional: one follow-up email Q&A within 7 days",
    ],
    milestones: [
      {
        title: "Pre-Session Agenda Confirmed",
        description:
          "Client submits the specific challenge or decision they need addressed. Admin and consultant review and confirm the session agenda 24 hours prior.",
      },
      {
        title: "Strategy Session Conducted",
        description:
          "90-minute working session focused entirely on the stated challenge. Consultant delivers frameworks, recommendations, and action steps in real time.",
      },
      {
        title: "Session Recap Delivered",
        description:
          "Written recap documenting decisions made, recommended actions, and any resources shared. Delivered to client portal within 24 hours of session.",
      },
    ],
    onboarding: [
      {
        phase: "compliance",
        items: ["SOW signed and payment collected prior to session date"],
      },
      {
        phase: "clarity",
        items: [
          "Client submits pre-session agenda form detailing the specific challenge",
          "Confirm session date, time, and format",
        ],
      },
      {
        phase: "culture",
        items: [
          "Set expectations: session is working-session style, not lecture — client should come prepared",
        ],
      },
      {
        phase: "connection",
        items: ["Send session confirmation and prep tips 48 hours prior"],
      },
      {
        phase: "checkback",
        items: ["7-day check-in to confirm client implemented action steps"],
      },
    ],
    legalDocs: [
      {
        type: "sow",
        required: true,
        note: "Single-session SOW defining scope and deliverables",
      },
    ],
  },

  // ─── 5. B.E. Accelerator Program ──────────────────────────────────────────
  {
    key: "accelerator",
    name: "B.E. Accelerator Program",
    tagline:
      "Intensive 90-day growth acceleration for established businesses ready to scale.",
    price: "$4,995",
    duration: "90 days",
    meetingsIncluded: "Bi-weekly",
    deliverables: [
      "Growth diagnostic and bottleneck analysis",
      "Revenue acceleration plan",
      "Team and delegation framework",
      "KPI dashboard setup and tracking system",
      "Investor or partnership readiness assessment (if applicable)",
      "Bi-weekly session recaps with accountability tracking",
      "90-day post-accelerator continuation plan",
    ],
    milestones: [
      {
        title: "Accelerator Kickoff & Diagnostic",
        description:
          "Session 1: Full growth diagnostic covering revenue performance, team capacity, systems health, and market positioning. Agree on 3 primary growth levers for the engagement.",
      },
      {
        title: "Revenue Acceleration Plan Built",
        description:
          "Develop a 90-day revenue plan with specific targets, tactics, and owner accountability. Client approves and commits to plan.",
      },
      {
        title: "Systems & Delegation Audit",
        description:
          "Identify operational bottlenecks that constrain growth. Build a delegation framework and assign owners. Confirm tools and workflows can support 2× volume.",
      },
      {
        title: "KPI Dashboard Live",
        description:
          "Set up a tracking system for the agreed-upon KPIs. Review data at each bi-weekly session to course-correct in real time.",
      },
      {
        title: "Mid-Accelerator Review (Day 45)",
        description:
          "Formal mid-point review: assess revenue progress, surface any new blockers, and adjust the second half of the plan accordingly.",
      },
      {
        title: "Final Debrief & Continuation Plan",
        description:
          "Closing session: review full 90-day results against targets, document wins and lessons learned, and deliver the continuation plan for the next quarter.",
      },
    ],
    onboarding: [
      {
        phase: "compliance",
        items: [
          "SOW signed and full payment or first installment collected",
          "NDA executed",
        ],
      },
      {
        phase: "clarity",
        items: [
          "Send Accelerator pre-engagement survey (financials, team size, current revenue, growth goals)",
          "Schedule bi-weekly session cadence for 90 days",
        ],
      },
      {
        phase: "culture",
        items: [
          "Share Accelerator expectations doc: accountability norms, response SLAs, and data-sharing requirements",
        ],
      },
      {
        phase: "connection",
        items: [
          "Assign lead consultant and confirm preferred working style",
          "Introduce any supporting team members who will join sessions",
        ],
      },
      {
        phase: "checkback",
        items: [
          "Day 30 pulse check on revenue traction and early blockers",
          "Day 60 formal mid-point review session",
        ],
      },
    ],
    legalDocs: [
      {
        type: "sow",
        required: true,
        note: "90-day SOW with milestone-based delivery schedule and KPI targets",
      },
      {
        type: "nda",
        required: true,
        note: "Required — client shares financials, team data, and proprietary strategy throughout",
      },
    ],
  },

  // ─── 6. Brand Identity & Positioning ──────────────────────────────────────
  {
    key: "brand_identity",
    name: "Brand Identity & Positioning",
    tagline:
      "Define who you are, who you serve, and how you show up in the market.",
    price: "Starting at $4,500",
    duration: "3–5 weeks",
    meetingsIncluded: "2–3 working sessions",
    deliverables: [
      "Brand discovery questionnaire and competitive landscape review",
      "Brand positioning statement and messaging pillars",
      "Ideal client profile (ICP) definition",
      "Brand voice guide (tone, language, do/don't examples)",
      "Tagline options (3 directions) with rationale",
      "One-page brand identity brief for designers or team use",
    ],
    milestones: [
      {
        title: "Brand Discovery & Research",
        description:
          "Complete brand questionnaire, competitive landscape review, and audience research. Admin delivers a findings summary prior to Session 1.",
      },
      {
        title: "Positioning Workshop (Session 1)",
        description:
          "Working session to define brand pillars, ideal client profile, and core positioning statement. All key decisions documented and approved by client.",
      },
      {
        title: "Messaging & Voice Development",
        description:
          "Develop brand voice guide, tagline options, and messaging hierarchy. Client reviews and selects preferred direction.",
      },
      {
        title: "Brand Identity Brief Delivered",
        description:
          "Compile all approved brand elements into a one-page identity brief ready for design or marketing team execution. Final client review and sign-off.",
      },
    ],
    onboarding: [
      {
        phase: "compliance",
        items: [
          "SOW signed and deposit (50%) collected",
          "Confirm final balance due upon delivery",
        ],
      },
      {
        phase: "clarity",
        items: [
          "Send brand discovery questionnaire",
          "Request existing brand assets, competitor examples, and brand inspiration references",
        ],
      },
      {
        phase: "culture",
        items: [
          "Explain iterative approval process — client will review and provide feedback at each phase",
        ],
      },
      {
        phase: "connection",
        items: ["Schedule Session 1 (Positioning Workshop) within first 5 days"],
      },
      {
        phase: "checkback",
        items: [
          "2-week post-delivery check-in to confirm client is using brand assets effectively",
        ],
      },
    ],
    legalDocs: [
      {
        type: "sow",
        required: true,
        note: "Project SOW with deliverable list, revision rounds included, and IP assignment upon final payment",
      },
      {
        type: "payment_authorization",
        required: true,
        note: "50% deposit at signing, balance due on final delivery",
      },
    ],
  },

  // ─── 7. Go-To-Market Launch Strategy ──────────────────────────────────────
  {
    key: "gtm_launch",
    name: "Go-To-Market Launch Strategy",
    tagline:
      "A complete GTM plan to bring your offer, product, or business to market with precision.",
    price: "Starting at $5,500",
    duration: "4–6 weeks",
    meetingsIncluded: "Weekly working sessions",
    deliverables: [
      "Market research and target segment analysis",
      "Go-to-market strategy document (channels, messaging, sequencing)",
      "Launch timeline and campaign calendar",
      "Sales enablement assets (pitch deck outline, one-pager template)",
      "Success metrics and KPI framework",
      "Post-launch optimization checklist",
    ],
    milestones: [
      {
        title: "Market Research & Segment Analysis",
        description:
          "Research target market, competitive landscape, and customer segments. Deliver a findings brief identifying the highest-opportunity segment to lead the launch.",
      },
      {
        title: "GTM Strategy Document Draft",
        description:
          "Draft the full go-to-market strategy: channel selection, messaging framework, launch sequencing, and partnership/distribution considerations. Client reviews and provides feedback.",
      },
      {
        title: "Launch Calendar Built",
        description:
          "Translate the GTM strategy into a week-by-week launch calendar with owners, milestones, and channel-specific tactics mapped out.",
      },
      {
        title: "Sales Enablement Assets Created",
        description:
          "Develop pitch deck outline, one-pager template, and key sales talking points aligned to the GTM messaging framework.",
      },
      {
        title: "KPI Framework & Success Metrics Confirmed",
        description:
          "Define launch success metrics, tracking methods, and a 30/60/90-day post-launch review cadence. Client approves final KPI framework.",
      },
      {
        title: "Final GTM Package Delivered",
        description:
          "Compile all deliverables into a final GTM package uploaded to client portal. Closing session walkthrough and handoff to client for execution.",
      },
    ],
    onboarding: [
      {
        phase: "compliance",
        items: [
          "SOW signed and deposit (50%) collected",
          "NDA executed to cover market research and proprietary business data",
        ],
      },
      {
        phase: "clarity",
        items: [
          "Send GTM intake form: product/service overview, existing audience, launch budget, and timeline",
          "Gather any existing market research, brand assets, or prior launch data",
        ],
      },
      {
        phase: "culture",
        items: [
          "Set expectations for client participation: client team provides market input; BECS drives strategic synthesis",
        ],
      },
      {
        phase: "connection",
        items: [
          "Identify primary client point of contact for approvals",
          "Schedule weekly working sessions for the full engagement",
        ],
      },
      {
        phase: "checkback",
        items: [
          "30-day post-delivery check-in to review launch progress and early results",
        ],
      },
    ],
    legalDocs: [
      {
        type: "sow",
        required: true,
        note: "Project SOW with full deliverable list, revision policy, and IP assignment",
      },
      {
        type: "nda",
        required: true,
        note: "Required — strategy work involves confidential market positioning and competitive intelligence",
      },
      {
        type: "payment_authorization",
        required: true,
        note: "50% deposit at signing, balance due on final delivery",
      },
    ],
  },
];

// ─── Lookup helpers ────────────────────────────────────────────────────────────

export function getServiceTemplate(key: string): ServiceTemplate | undefined {
  return SERVICE_TEMPLATES.find((s) => s.key === key);
}

export const SERVICE_TEMPLATE_MAP: Record<string, ServiceTemplate> =
  Object.fromEntries(SERVICE_TEMPLATES.map((s) => [s.key, s]));
