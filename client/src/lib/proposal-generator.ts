// ─── Proposal Generator ──────────────────────────────────────────────────────
// Generates a branded multi-page PDF proposal in the B.A.S format:
//   Page 1: Cover (client name + presenter)
//   Page 2: Mission + value prop + PES banner
//   Page 3: Growth Journey (intro)
//   Page 4: Integration Intake + "The X Difference"
//   Page 5: Tiered Service & Pricing Matrix (Plan / Evolve / Succeed)
//   Page 6: Recommended Path + Next Steps + Contact
//
// Uses jsPDF with built-in Helvetica (keeps bundle lean). Every text block
// is word-wrapped; every page uses a consistent margin + footer.

import jsPDF from "jspdf";

// ─── Brand palette (matches BECS OS theme) ──────────────────────────────────
const BRAND = {
  navy: [25, 35, 68] as [number, number, number],        // hsl(232,45%,18%)
  navyDeep: [16, 23, 44] as [number, number, number],    // hsl(232,45%,12%)
  lime: [163, 217, 94] as [number, number, number],      // hsl(83,60%,57%)
  limeText: [25, 35, 68] as [number, number, number],    // dark text on lime
  white: [255, 255, 255] as [number, number, number],
  slate: [100, 116, 139] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
};

// ─── Input types ────────────────────────────────────────────────────────────
export interface ProposalTier {
  name: string;          // e.g. "PLAN", "EVOLVE", "SUCCEED"
  sublabel?: string;     // e.g. "(Assessment Only)"
  focus: string;         // e.g. "Diagnostics & Strategy"
  scope: string[];       // bullet list of what's included
  deliverable: string;   // one-line outcome
  investment: string;    // e.g. "$750 flat"
}

export interface ProposalInput {
  // Cover
  clientName: string;             // "BORN APPAREL STUDIO"
  clientShortName?: string;       // "B.A.S"
  presenterName: string;          // "Brandon Ellis"
  presenterEmail?: string;        // default: beconsultingsolutions@gmail.com
  // Mission (editable narrative)
  missionStatement?: string;
  valueProposition?: string;
  // Growth journey (editable narrative)
  journeyIntro?: string;          // context about the client
  // Intake section
  intakeFocusAreas?: { label: string; description: string }[];
  intakeDeliverable?: string;
  intakeInvestment?: string;
  // Differentiators
  differenceTitle?: string;       // e.g. "The B.A.S Difference"
  differencePoints?: { title: string; description: string }[];
  // Pricing
  tiersIntro?: string;
  tiers: ProposalTier[];
  // Close
  recommendedPathIntro?: string;
  nextSteps?: string[];
  closingTagline?: string;        // e.g. "Born Apparel Studio – Scaling brands..."
}

// ─── Defaults drawn from the B.A.S reference document ───────────────────────
export const DEFAULT_MISSION =
  "B.E Consulting Solutions is dedicated to empowering brands through strategic development and innovative solutions. Our mission is to help organizations enhance their brand identity, connect with their audience, and achieve sustainable growth. We focus on building relationships that drive success and bring lasting value to our clients.";

export const DEFAULT_VALUE_PROP =
  "Our unique value proposition lies in our expertise and commitment to understanding each client's specific needs. We leverage a combination of market insights, creativity, and analytics to craft tailored strategies that resonate with target audiences, ensuring that every brand achieves its desired impact and recognition in the marketplace.";

export const DEFAULT_TIERS: ProposalTier[] = [
  {
    name: "PLAN",
    sublabel: "(Assessment Only)",
    focus: "Diagnostics & Strategy",
    scope: [
      "Brand & development assessment",
      "Costing & margin analysis",
      "Risk identification & recommendations",
      "Strategic roadmap",
    ],
    deliverable: "Action plan + 1-page growth roadmap",
    investment: "$750 flat",
  },
  {
    name: "EVOLVE",
    sublabel: "(Implementation Partnership)",
    focus: "Co-Building & Guided Execution",
    scope: [
      "Service playbook build-out",
      "Capsule collection package (4–8 pieces)",
      "Delegation framework",
      "Vendor & supplier network integration",
      "Authority content & assets",
    ],
    deliverable: "Implemented systems, trained team, capsule collection support",
    investment: "$7,500 – $12,000 (scope-based)",
  },
  {
    name: "SUCCEED",
    sublabel: "(Agency-Led Management)",
    focus: "Client Builds & Hands Off, Owner Directs",
    scope: [
      "Seasonal development retainers",
      "Full studio partnership",
      "Vendor partnership management",
      "Quarterly brand reviews",
      "Department training & handoff",
    ],
    deliverable: "End-to-end management + training for client team",
    investment: "$2,500 – $4,000/month retainer",
  },
];

export const DEFAULT_NEXT_STEPS = [
  "Book Your Assessment – the required first step into the growth journey.",
  "Receive Your Roadmap – understand where your brand stands and what comes next.",
  "Partner with BECS – move confidently into Plan, Evolve, or Succeed phases.",
];

// ─── Layout constants (US Letter portrait, 612 × 792 pt) ────────────────────
const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 54;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Helper: fill an entire page with a color ───────────────────────────────
function fillPage(doc: jsPDF, rgb: [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
}

// ─── Helper: word-wrapped text, returns Y after rendering ───────────────────
function drawText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxW: number,
  opts: {
    size?: number;
    color?: [number, number, number];
    font?: "helvetica" | "times";
    style?: "normal" | "bold" | "italic" | "bolditalic";
    lineHeight?: number;
    align?: "left" | "center" | "right";
  } = {}
): number {
  const size = opts.size ?? 10;
  const color = opts.color ?? BRAND.navy;
  const font = opts.font ?? "helvetica";
  const style = opts.style ?? "normal";
  const lineHeight = opts.lineHeight ?? 1.4;
  doc.setFont(font, style);
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
  const lines = doc.splitTextToSize(text, maxW) as string[];
  const lineH = size * lineHeight;
  let drawX = x;
  if (opts.align === "center") drawX = x + maxW / 2;
  else if (opts.align === "right") drawX = x + maxW;
  lines.forEach((line, i) => {
    doc.text(line, drawX, y + i * lineH, { align: opts.align ?? "left" });
  });
  return y + lines.length * lineH;
}

// ─── Helper: brand footer on every interior page ────────────────────────────
function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(BRAND.slate[0], BRAND.slate[1], BRAND.slate[2]);
  doc.text("B.E. Consulting Solutions", MARGIN, PAGE_H - 30);
  doc.text(`${pageNum} / ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 30, {
    align: "right",
  });
}

// ─── Helper: bulleted list, returns Y after ─────────────────────────────────
function drawBullets(
  doc: jsPDF,
  items: string[],
  x: number,
  y: number,
  maxW: number,
  opts: { size?: number; color?: [number, number, number] } = {}
): number {
  const size = opts.size ?? 10;
  const color = opts.color ?? BRAND.navy;
  const indent = 14;
  let cursor = y;
  for (const item of items) {
    doc.setFillColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
    doc.circle(x + 4, cursor - size * 0.35, 2, "F");
    cursor = drawText(doc, item, x + indent, cursor, maxW - indent, {
      size,
      color,
      lineHeight: 1.45,
    });
    cursor += 4;
  }
  return cursor;
}

// ─── PAGE 1 — Cover ─────────────────────────────────────────────────────────
function drawCover(doc: jsPDF, input: ProposalInput) {
  fillPage(doc, BRAND.navyDeep);

  // BE logo lockup (top-left)
  doc.setFillColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
  doc.roundedRect(MARGIN, MARGIN, 56, 56, 10, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(BRAND.navy[0], BRAND.navy[1], BRAND.navy[2]);
  doc.text("BE", MARGIN + 10, MARGIN + 38);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(BRAND.white[0], BRAND.white[1], BRAND.white[2]);
  doc.text("BE", MARGIN + 70, MARGIN + 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 210, 230);
  doc.text("CONSULTING SOLUTIONS", MARGIN + 70, MARGIN + 38);

  // Client name — hero
  const heroY = PAGE_H * 0.42;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  doc.setTextColor(BRAND.white[0], BRAND.white[1], BRAND.white[2]);
  const lines = doc.splitTextToSize(input.clientName.toUpperCase(), CONTENT_W) as string[];
  lines.forEach((line, i) => {
    doc.text(line, PAGE_W / 2, heroY + i * 48, { align: "center" });
  });

  // Accent line
  doc.setFillColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
  doc.rect(PAGE_W / 2 - 30, heroY + lines.length * 48 + 16, 60, 3, "F");

  // Presented to / by
  const metaY = PAGE_H - 180;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
  doc.text("PRESENTED TO", MARGIN, metaY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(BRAND.white[0], BRAND.white[1], BRAND.white[2]);
  doc.text(input.clientName, MARGIN, metaY + 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
  doc.text("PRESENTED BY", PAGE_W - MARGIN, metaY, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(BRAND.white[0], BRAND.white[1], BRAND.white[2]);
  doc.text(input.presenterName, PAGE_W - MARGIN, metaY + 20, { align: "right" });

  // P.E.S footer tagline
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
  doc.text("PLAN   ·   EVOLVE   ·   SUCCEED", PAGE_W / 2, PAGE_H - 60, {
    align: "center",
  });
}

// ─── PAGE 2 — Mission + value prop ──────────────────────────────────────────
function drawMission(doc: jsPDF, input: ProposalInput) {
  fillPage(doc, BRAND.white);
  // Side accent stripe
  doc.setFillColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
  doc.rect(0, 0, 8, PAGE_H, "F");

  let y = MARGIN + 10;
  y = drawText(doc, "OUR MISSION", MARGIN, y, CONTENT_W, {
    size: 10,
    color: BRAND.lime,
    style: "bold",
  });
  y += 10;
  y = drawText(
    doc,
    input.missionStatement || DEFAULT_MISSION,
    MARGIN,
    y,
    CONTENT_W,
    { size: 14, color: BRAND.navy, style: "bold", lineHeight: 1.45 }
  );

  y += 30;
  y = drawText(doc, "OUR VALUE PROPOSITION", MARGIN, y, CONTENT_W, {
    size: 10,
    color: BRAND.lime,
    style: "bold",
  });
  y += 10;
  y = drawText(
    doc,
    input.valueProposition || DEFAULT_VALUE_PROP,
    MARGIN,
    y,
    CONTENT_W,
    { size: 11, color: BRAND.navy, lineHeight: 1.55 }
  );

  // Bottom PES banner
  const bannerY = PAGE_H - 100;
  doc.setFillColor(BRAND.navy[0], BRAND.navy[1], BRAND.navy[2]);
  doc.rect(0, bannerY, PAGE_W, 40, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
  doc.text("PLAN   ·   EVOLVE   ·   SUCCEED", PAGE_W / 2, bannerY + 26, {
    align: "center",
  });
}

// ─── PAGE 3 — Growth Journey intro ──────────────────────────────────────────
function drawJourney(doc: jsPDF, input: ProposalInput) {
  fillPage(doc, BRAND.white);

  // Top ribbon with client name
  doc.setFillColor(BRAND.navy[0], BRAND.navy[1], BRAND.navy[2]);
  doc.rect(0, 0, PAGE_W, 70, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(BRAND.white[0], BRAND.white[1], BRAND.white[2]);
  doc.text(input.clientName.toUpperCase(), MARGIN, 44);

  let y = 100;
  const shortName = input.clientShortName || input.clientName;
  y = drawText(doc, `(${shortName}) Growth Journey`, MARGIN, y, CONTENT_W, {
    size: 20,
    color: BRAND.navy,
    style: "bold",
  });
  y += 10;
  y = drawText(
    doc,
    "Every engagement begins with an Assessment, designed to diagnose a client's current needs and map the right growth pathway. From there, clients are guided through phases aligned with the Plan → Evolve → Succeed framework.",
    MARGIN,
    y,
    CONTENT_W,
    { size: 11, color: BRAND.navy, lineHeight: 1.55 }
  );

  y += 30;
  y = drawText(doc, "Introduction", MARGIN, y, CONTENT_W, {
    size: 14,
    color: BRAND.lime,
    style: "bold",
  });
  y += 8;
  y = drawText(
    doc,
    input.journeyIntro ||
      `This guide outlines how ${shortName} will be supported through strategic frameworks, operational build-out, and long-term growth partnership. Our role is to provide the systems, clarity, and execution support needed to move from vision to scalable outcomes.`,
    MARGIN,
    y,
    CONTENT_W,
    { size: 11, color: BRAND.navy, lineHeight: 1.6 }
  );
}

// ─── PAGE 4 — Integration Intake + Differentiators ──────────────────────────
function drawIntakeAndDifference(doc: jsPDF, input: ProposalInput) {
  fillPage(doc, BRAND.white);
  doc.setFillColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
  doc.rect(0, 0, 8, PAGE_H, "F");

  let y = MARGIN + 10;
  y = drawText(doc, "One-Time Integration Intake (P.E.S. Aligned)", MARGIN, y, CONTENT_W, {
    size: 16,
    color: BRAND.navy,
    style: "bold",
  });
  y += 8;
  y = drawText(
    doc,
    "For clients who do not enter through the standard P.E.S. intake process, we offer a One-Time Integration Intake to quickly gather the essential information needed for assessment and project alignment.",
    MARGIN,
    y,
    CONTENT_W,
    { size: 10, color: BRAND.navy, lineHeight: 1.5 }
  );

  y += 14;
  y = drawText(doc, "Areas of Focus:", MARGIN, y, CONTENT_W, {
    size: 10,
    color: BRAND.lime,
    style: "bold",
  });
  y += 4;
  const focusAreas =
    input.intakeFocusAreas && input.intakeFocusAreas.length > 0
      ? input.intakeFocusAreas
      : [
          {
            label: "Business Model Snapshot",
            description: "Current services, revenue streams, and client types.",
          },
          {
            label: "Creative / Service Assets",
            description: "Existing work product, templates, or artifacts.",
          },
          {
            label: "Operations Overview",
            description: "Workflow tools, communication methods, team members involved.",
          },
          {
            label: "Vendor & Partner Status",
            description: "Current supplier relationships, sourcing, and partnerships.",
          },
          {
            label: "Financial Baseline",
            description: "Budget expectations, cost management, and pricing challenges.",
          },
          {
            label: "Growth Goals",
            description: "Short- and long-term brand objectives.",
          },
        ];
  for (const area of focusAreas) {
    doc.setFillColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
    doc.circle(MARGIN + 4, y - 3, 2, "F");
    const labelY = drawText(doc, area.label, MARGIN + 14, y, CONTENT_W - 14, {
      size: 10,
      color: BRAND.navy,
      style: "bold",
    });
    y = drawText(doc, area.description, MARGIN + 14, labelY, CONTENT_W - 14, {
      size: 10,
      color: BRAND.navy,
      lineHeight: 1.45,
    });
    y += 3;
  }

  y += 6;
  // Deliverable / investment box
  const boxH = 52;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 6, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
  doc.text("DELIVERABLE", MARGIN + 12, y + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(BRAND.navy[0], BRAND.navy[1], BRAND.navy[2]);
  doc.text(
    doc.splitTextToSize(
      input.intakeDeliverable ||
        "Customized P.E.S. Intake Report highlighting immediate priorities, alignment gaps, and action points for strategic support.",
      CONTENT_W - 24
    ),
    MARGIN + 12,
    y + 30
  );

  y += boxH + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
  doc.text("INVESTMENT", MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(BRAND.navy[0], BRAND.navy[1], BRAND.navy[2]);
  y = drawText(
    doc,
    input.intakeInvestment || "Included as part of the initial Assessment ($750 flat).",
    MARGIN,
    y + 14,
    CONTENT_W,
    { size: 11, color: BRAND.navy }
  );

  // Differentiators block
  y += 20;
  if (y > PAGE_H - 180) {
    // safety: new page if we ran long
    drawFooter(doc, doc.getNumberOfPages(), 0);
    doc.addPage();
    fillPage(doc, BRAND.white);
    doc.setFillColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
    doc.rect(0, 0, 8, PAGE_H, "F");
    y = MARGIN + 10;
  }
  const shortName = input.clientShortName || input.clientName;
  y = drawText(
    doc,
    input.differenceTitle || `The ${shortName} Difference`,
    MARGIN,
    y,
    CONTENT_W,
    { size: 16, color: BRAND.navy, style: "bold" }
  );
  y += 8;
  const points =
    input.differencePoints && input.differencePoints.length > 0
      ? input.differencePoints
      : [
          {
            title: "Assessment-First",
            description: "Every client begins with a clear, diagnostic process.",
          },
          {
            title: "Structured Growth Path",
            description: "Clients move through Plan → Evolve → Succeed.",
          },
          {
            title: "Owner-Led Execution",
            description: "Leadership remains with you; we build the systems your team executes.",
          },
          {
            title: "Sustainable Systems",
            description: "Operational frameworks and ethical partnerships embedded throughout.",
          },
        ];
  for (const p of points) {
    doc.setFillColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
    doc.circle(MARGIN + 4, y - 3, 2, "F");
    const tY = drawText(doc, p.title + ":", MARGIN + 14, y, CONTENT_W - 14, {
      size: 10,
      color: BRAND.navy,
      style: "bold",
    });
    y = drawText(doc, p.description, MARGIN + 14, tY, CONTENT_W - 14, {
      size: 10,
      color: BRAND.navy,
      lineHeight: 1.45,
    });
    y += 3;
  }
}

// ─── PAGE 5 — Pricing Matrix ────────────────────────────────────────────────
function drawPricingMatrix(doc: jsPDF, input: ProposalInput) {
  fillPage(doc, BRAND.white);
  let y = MARGIN;
  y = drawText(doc, "Tiered Service & Pricing Matrix", MARGIN, y, CONTENT_W, {
    size: 20,
    color: BRAND.navy,
    style: "bold",
  });
  y += 6;
  y = drawText(
    doc,
    input.tiersIntro ||
      "At B.E. Consulting Solutions we design pricing frameworks that are transparent, sustainable, and growth-oriented. Each tier is cumulative — clients build from a solid foundation (Plan), move into structured implementation (Evolve), and secure long-term agency-level support (Succeed).",
    MARGIN,
    y,
    CONTENT_W,
    { size: 10, color: BRAND.navy, lineHeight: 1.5 }
  );
  y += 10;

  // Cards
  const tiers = input.tiers.length > 0 ? input.tiers : DEFAULT_TIERS;
  const cardGap = 10;
  for (const tier of tiers) {
    // Estimate height first
    const scopeLines = tier.scope.flatMap(
      (s) =>
        doc.splitTextToSize(`• ${s}`, CONTENT_W - 170) as string[]
    );
    const deliverableLines = doc.splitTextToSize(
      tier.deliverable,
      CONTENT_W - 170
    ) as string[];
    const rightColH = 24 + scopeLines.length * 12 + 18 + deliverableLines.length * 12 + 14;
    const leftColH = 60;
    const cardH = Math.max(rightColH, leftColH) + 20;

    // New page if we can't fit
    if (y + cardH > PAGE_H - 70) {
      drawFooter(doc, doc.getNumberOfPages(), 0);
      doc.addPage();
      fillPage(doc, BRAND.white);
      y = MARGIN;
    }

    // Card background
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(BRAND.border[0], BRAND.border[1], BRAND.border[2]);
    doc.roundedRect(MARGIN, y, CONTENT_W, cardH, 8, 8, "FD");

    // Left: tier badge
    doc.setFillColor(BRAND.navy[0], BRAND.navy[1], BRAND.navy[2]);
    doc.roundedRect(MARGIN + 10, y + 10, 140, cardH - 20, 6, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
    doc.text(tier.name, MARGIN + 80, y + 36, { align: "center" });
    if (tier.sublabel) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(BRAND.white[0], BRAND.white[1], BRAND.white[2]);
      const subLines = doc.splitTextToSize(tier.sublabel, 120) as string[];
      subLines.forEach((line, i) => {
        doc.text(line, MARGIN + 80, y + 52 + i * 10, { align: "center" });
      });
    }
    // Investment pill
    doc.setFillColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
    doc.roundedRect(MARGIN + 18, y + cardH - 40, 124, 24, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(BRAND.navy[0], BRAND.navy[1], BRAND.navy[2]);
    const invLines = doc.splitTextToSize(tier.investment, 118) as string[];
    const invStartY =
      y + cardH - 40 + (24 - invLines.length * 10) / 2 + 8;
    invLines.forEach((line, i) => {
      doc.text(line, MARGIN + 80, invStartY + i * 10, { align: "center" });
    });

    // Right: focus + scope + deliverable
    const rightX = MARGIN + 170;
    let ry = y + 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
    doc.text("FOCUS", rightX, ry);
    ry += 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(BRAND.navy[0], BRAND.navy[1], BRAND.navy[2]);
    doc.text(tier.focus, rightX, ry);
    ry += 14;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
    doc.text("SCOPE", rightX, ry);
    ry += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(BRAND.navy[0], BRAND.navy[1], BRAND.navy[2]);
    scopeLines.forEach((line) => {
      doc.text(line, rightX, ry);
      ry += 11;
    });
    ry += 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
    doc.text("DELIVERABLE", rightX, ry);
    ry += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(BRAND.navy[0], BRAND.navy[1], BRAND.navy[2]);
    deliverableLines.forEach((line) => {
      doc.text(line, rightX, ry);
      ry += 11;
    });

    y += cardH + cardGap;
  }
}

// ─── PAGE 6 — Recommended Path + Next Steps + Close ─────────────────────────
function drawClose(doc: jsPDF, input: ProposalInput) {
  fillPage(doc, BRAND.white);

  let y = MARGIN;
  y = drawText(doc, "Recommended Path", MARGIN, y, CONTENT_W, {
    size: 20,
    color: BRAND.navy,
    style: "bold",
  });
  y += 8;
  y = drawText(
    doc,
    input.recommendedPathIntro ||
      "While each client begins with an Assessment, most brands follow a natural progression:",
    MARGIN,
    y,
    CONTENT_W,
    { size: 11, color: BRAND.navy, lineHeight: 1.55 }
  );
  y += 6;
  y = drawBullets(
    doc,
    [
      "Start with PLAN → clarity on current state and strategy.",
      "Move into EVOLVE → implement systems and build capabilities with consultation.",
      "Graduate into SUCCEED → secure ongoing growth through retainers and full agency support.",
    ],
    MARGIN,
    y,
    CONTENT_W,
    { size: 11 }
  );

  y += 20;

  // THANK YOU banner
  doc.setFillColor(BRAND.navy[0], BRAND.navy[1], BRAND.navy[2]);
  doc.rect(MARGIN, y, CONTENT_W, 60, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
  doc.text("THANK YOU", MARGIN + CONTENT_W / 2, y + 38, { align: "center" });
  y += 80;

  y = drawText(doc, "Next Steps", MARGIN, y, CONTENT_W, {
    size: 16,
    color: BRAND.navy,
    style: "bold",
  });
  y += 6;
  const nextSteps =
    input.nextSteps && input.nextSteps.length > 0
      ? input.nextSteps
      : DEFAULT_NEXT_STEPS;
  y = drawBullets(doc, nextSteps, MARGIN, y, CONTENT_W, { size: 11 });

  // Closing tagline + contact
  const closeY = PAGE_H - 140;
  if (input.closingTagline) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(BRAND.slate[0], BRAND.slate[1], BRAND.slate[2]);
    const lines = doc.splitTextToSize(input.closingTagline, CONTENT_W) as string[];
    lines.forEach((line, i) =>
      doc.text(line, PAGE_W / 2, closeY + i * 14, { align: "center" })
    );
  }

  // Contact box
  doc.setFillColor(BRAND.navyDeep[0], BRAND.navyDeep[1], BRAND.navyDeep[2]);
  doc.rect(0, PAGE_H - 80, PAGE_W, 80, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
  doc.text("CONTACT", MARGIN, PAGE_H - 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(BRAND.white[0], BRAND.white[1], BRAND.white[2]);
  doc.text(input.presenterName, MARGIN, PAGE_H - 34);
  doc.setTextColor(200, 210, 230);
  doc.text(
    input.presenterEmail || "beconsultingsolutions@gmail.com",
    MARGIN,
    PAGE_H - 20
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(BRAND.lime[0], BRAND.lime[1], BRAND.lime[2]);
  doc.text("PLAN · EVOLVE · SUCCEED", PAGE_W - MARGIN, PAGE_H - 24, {
    align: "right",
  });
}

// ─── Main export: build + save ──────────────────────────────────────────────
export function generateProposalPDF(input: ProposalInput): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });

  drawCover(doc, input);
  doc.addPage();
  drawMission(doc, input);
  doc.addPage();
  drawJourney(doc, input);
  doc.addPage();
  drawIntakeAndDifference(doc, input);
  doc.addPage();
  drawPricingMatrix(doc, input);
  doc.addPage();
  drawClose(doc, input);

  // Add footers to interior pages (skip cover)
  const total = doc.getNumberOfPages();
  for (let p = 2; p <= total; p++) {
    doc.setPage(p);
    drawFooter(doc, p, total);
  }

  return doc;
}

export function downloadProposalPDF(input: ProposalInput, filename?: string) {
  const doc = generateProposalPDF(input);
  const safeName = (input.clientName || "Proposal")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  doc.save(filename || `${safeName}-Proposal.pdf`);
}

// ─── Helper: build proposal input from a client + selected service keys ────
// Wired to service-templates so picking services auto-fills tiers + pricing.
import { SERVICE_TEMPLATES } from "./service-templates";

export interface AutofillArgs {
  clientName: string;
  clientShortName?: string;
  presenterName: string;
  presenterEmail?: string;
  serviceKeys: string[];    // subset of SERVICE_TEMPLATES keys
  journeyIntro?: string;
}

export function autofillFromServices(args: AutofillArgs): ProposalInput {
  const tiers: ProposalTier[] = args.serviceKeys
    .map((key) => SERVICE_TEMPLATES.find((s) => s.key === key))
    .filter((s): s is (typeof SERVICE_TEMPLATES)[number] => !!s)
    .map((s) => ({
      name: s.name.toUpperCase(),
      sublabel: `(${s.duration})`,
      focus: s.tagline,
      scope: s.deliverables,
      deliverable: s.milestones[s.milestones.length - 1]?.title || s.tagline,
      investment: s.price + (s.paymentNote ? ` · ${s.paymentNote}` : ""),
    }));

  return {
    clientName: args.clientName,
    clientShortName: args.clientShortName,
    presenterName: args.presenterName,
    presenterEmail: args.presenterEmail,
    journeyIntro: args.journeyIntro,
    tiers: tiers.length > 0 ? tiers : DEFAULT_TIERS,
  };
}
