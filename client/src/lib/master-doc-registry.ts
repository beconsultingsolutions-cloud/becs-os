/**
 * BECS Master Doc Registry
 *
 * Canonical legal/contract/onboarding documents, each broken into the section
 * payload the MasterDocLayout consumes.
 *
 * Source of truth: Notion ⚖️ Legal & Contracts hub
 *   - 3879c86eeaa281a8bd49c85551f0552d  Master Proposal Template
 *   - 3339c86eeaa28197b416e72c5ec92117  Master Service Agreement
 *   - 3829c86eeaa281bab51ded06c9b00ea6  Non-Circumvention & Exclusivity Addendum
 *   - 3849c86eeaa281088342d9eb22014b59  Addendum — Home Health Variant
 *   - 3829c86eeaa2815ca07ffaae2bb20b29  BECS Client Onboarding Template
 *
 * Tokens (replaced at render time):
 *   {{CLIENT_NAME}}     {{CLIENT_LOCATION}}   {{CLIENT_BUSINESS_TYPE}}
 *   {{INDUSTRY}}        {{INDUSTRY_ALT}}      {{RETAINER_PRICE}}
 *   {{HERO_HEADLINE}}   {{HERO_SUBLINE}}
 *   {{EFFECTIVE_DATE}}  {{DEPOSIT_AMOUNT}}    {{SERVICE_NAME}}
 *   {{KICKOFF_DATE}}    {{ADDENDUM_DATE}}     {{SOW_REFERENCE}}
 */

export type MasterDocId =
  | "msa"
  | "addendum-noncirc"
  | "addendum-noncirc-home-health"
  | "onboarding-welcome"
  | "proposal-canonical"
  | "tos"
  | "privacy";

export interface MasterDocSection {
  /** Anchor id used by progress + scrollspy. */
  id: string;
  /** Eyebrow above the title (uppercase). */
  eyebrow?: string;
  /** Section title. */
  title: string;
  /** Optional short navbar/tab label (defaults to title). */
  navLabel?: string;
  /** Markdown-ish HTML body. Tokens are replaced at render time. */
  body: string;
}

export interface MasterDoc {
  id: MasterDocId;
  kind: "contract" | "addendum" | "onboarding" | "proposal" | "policy";
  title: string;
  /** Hero eyebrow (e.g. "CONTRACT", "PROPOSAL"). */
  heroEyebrow: string;
  /** Hero headline (may contain <em>…</em>). */
  heroHeadline: string;
  heroSubline: string;
  /** Defaults the renderer uses if metadata isn't passed in. */
  defaultMeta?: { label: string; value: string }[];
  sections: MasterDocSection[];
  /** Source URL for "view canonical" links. */
  source?: string;
}

/* ────────────────────────────────────────────────────────────────────
 * 1. Master Service Agreement
 * ──────────────────────────────────────────────────────────────────── */
const MSA: MasterDoc = {
  id: "msa",
  kind: "contract",
  title: "Master Service Agreement",
  heroEyebrow: "Contract",
  heroHeadline: "BECS <em>Master Service Agreement</em>",
  heroSubline:
    "The framework that governs every BECS engagement. Specific scope, deliverables, and pricing live in the attached Service Addendum or SOW.",
  defaultMeta: [
    { label: "Effective Date", value: "{{EFFECTIVE_DATE}}" },
    { label: "Service Provider", value: "BE Consulting Solutions" },
    { label: "Owner", value: "Brandon Ellis Bynum" },
    { label: "Governing Law", value: "State of Texas" },
  ],
  source: "https://app.notion.com/p/3339c86eeaa28197b416e72c5ec92117",
  sections: [
    {
      id: "msa-parties",
      eyebrow: "00",
      title: "Parties",
      body: `
        <p><strong>Service Provider:</strong> BE Consulting Solutions — Owner: Brandon Ellis Bynum. Houston, TX. beconsultingsolutions@gmail.com · 979.637.8453 · <a href="http://thebeconsultingsolution.com">thebeconsultingsolution.com</a> (hereinafter "BECS" or "Company").</p>
        <p><strong>Client:</strong> {{CLIENT_NAME}} · {{CLIENT_LOCATION}} · {{CLIENT_BUSINESS_TYPE}} (hereinafter "Client"). Together referred to as the "Parties."</p>
      `,
    },
    {
      id: "msa-purpose",
      eyebrow: "01",
      title: "Purpose of this Agreement",
      body: `
        <p>This Agreement establishes the general terms and conditions that govern all consulting services provided by BECS to Client. Specific engagement details — including the service selected, deliverables, timeline, and investment — are documented in a Service Addendum or separate Scope of Work, which is incorporated into this Agreement by reference.</p>
      `,
    },
    {
      id: "msa-scope",
      eyebrow: "02",
      title: "Scope of Services",
      body: `
        <h3>2.1 Services Described</h3>
        <p>BECS provides the consulting and business strategy services described in the Service Addendum or SOW, including business strategy consulting, operational planning, brand identity development, go-to-market strategy, coaching, and related advisory work.</p>
        <h3>2.2 Service Addendum</h3>
        <p>Each engagement is further detailed in a Service Addendum that specifies the service package, deliverables, timeline, and investment. In any conflict between this Agreement and an Addendum, the Addendum controls for that engagement.</p>
        <h3>2.3 No Guarantee of Outcomes</h3>
        <p>BECS provides strategic guidance, frameworks, and expertise. Client's results depend on Client's own effort, implementation, market conditions, and other factors outside BECS's control. BECS makes no guarantee of any specific KPI, sales, revenue, ROI, capital access, or earnings.</p>
      `,
    },
    {
      id: "msa-investment",
      eyebrow: "03",
      title: "Investment & Payment Terms",
      body: `
        <h3>3.1 Service Investment</h3>
        <p>The total investment is stated in the applicable Addendum or SOW.</p>
        <h3>3.2 Payment Due Date</h3>
        <p>One-time payment: full investment due prior to start. Payment plan: a non-refundable deposit of {{DEPOSIT_AMOUNT}} is due upon signing; remaining installments follow the SOW schedule.</p>
        <h3>3.4 Late Payments</h3>
        <p>Payments not received within 5 business days are considered late. Accounts more than 15 days past due may incur a late fee of 1.5% per month.</p>
        <h3>3.5 Returned Payments</h3>
        <p>A $35 fee applies to any returned check or failed electronic payment.</p>
        <h3>3.7 Deposits Are Non-Refundable</h3>
        <p>All deposits paid toward services under this Agreement are <strong>non-refundable</strong>.</p>
      `,
    },
    {
      id: "msa-timeline",
      eyebrow: "04",
      title: "Timeline & Deliverables",
      body: `
        <h3>4.1 Start Date</h3>
        <p>Services begin on the date specified in the SOW once the Agreement is signed and the required deposit or full payment has been received.</p>
        <h3>4.2 Deliverable Schedule</h3>
        <p>Timelines are estimates and may shift due to Client responsiveness, scope changes, or circumstances beyond BECS's control.</p>
        <h3>4.3 Client Delays</h3>
        <p>If Client delays the project, BECS may adjust the timeline at no additional charge or reschedule with reasonable notice.</p>
      `,
    },
    {
      id: "msa-client-resp",
      eyebrow: "05",
      title: "Client Responsibilities",
      body: `
        <p>Client agrees to:</p>
        <ul>
          <li><strong>Provide Information</strong> — accurate, complete, timely materials and access.</li>
          <li><strong>Timely Feedback</strong> — review and respond within 3–5 business days.</li>
          <li><strong>System Access</strong> — supply access to tools, platforms, or accounts as scoped.</li>
          <li><strong>Decision-Making</strong> — designate a single point of contact with authority.</li>
          <li><strong>Implementation</strong> — success depends on Client's own implementation unless explicitly scoped to BECS.</li>
        </ul>
      `,
    },
    {
      id: "msa-ip",
      eyebrow: "06",
      title: "Intellectual Property",
      body: `
        <h3>6.1 BECS Proprietary Materials</h3>
        <p>BECS retains all rights to its proprietary frameworks, methodologies, tools, templates, and pre-existing intellectual property ("BECS IP"). Nothing transfers ownership of BECS IP to Client.</p>
        <h3>6.2 Client License</h3>
        <p>BECS grants Client a limited, non-exclusive, non-transferable license to use BECS IP solely for Client's own internal business purposes. No resale, sublicensing, reproduction, or distribution to third parties.</p>
        <h3>6.3 Client-Specific Deliverables</h3>
        <p>Work product created specifically for Client (custom brand identity, marketing copy, go-to-market plan) becomes Client's property upon receipt of full payment.</p>
        <h3>6.4 Portfolio Rights</h3>
        <p>BECS may reference Client's name and the nature of the engagement (not confidential details) in portfolio and case studies unless Client objects in writing within 30 days of conclusion.</p>
      `,
    },
    {
      id: "msa-confidentiality",
      eyebrow: "07",
      title: "Confidentiality",
      body: `
        <p>"Confidential Information" means any non-public information shared by one Party with the other — business strategies, financial data, client lists, pricing, methodologies, and any information marked or reasonably understood as confidential.</p>
        <p>Each Party agrees to keep the other's Confidential Information strictly confidential, use it only for this Agreement, and not disclose it to third parties without prior written consent. Obligations survive termination for <strong>three (3) years</strong>.</p>
      `,
    },
    {
      id: "msa-liability",
      eyebrow: "08",
      title: "Limitation of Liability",
      body: `
        <h3>8.1 No Consequential Damages</h3>
        <p>To the maximum extent permitted by law, neither Party is liable for indirect, incidental, consequential, special, or punitive damages, including lost profits.</p>
        <h3>8.2 Cap on Liability</h3>
        <p>BECS's total cumulative liability is capped at the total amount paid by Client during the <strong>three (3) months</strong> immediately preceding the claim.</p>
        <h3>8.3 Professional Advice Disclaimer</h3>
        <p>BECS provides business consulting only. Services do not constitute legal, financial, tax, or accounting advice.</p>
      `,
    },
    {
      id: "msa-termination",
      eyebrow: "09",
      title: "Termination & Refund Policy",
      body: `
        <h3>9.1 Termination by Client</h3>
        <table class="md-field-table">
          <thead><tr><th>When Cancellation Occurs</th><th>Refund</th></tr></thead>
          <tbody>
            <tr><th scope="row">Before services begin (prior to kickoff)</th><td>Full refund minus any non-refundable deposit</td></tr>
            <tr><th scope="row">Before the midpoint of the engagement</th><td>50% refund of amount paid (excluding deposit)</td></tr>
            <tr><th scope="row">At or after the midpoint of the engagement</th><td>No refund</td></tr>
          </tbody>
        </table>
        <p>For session-based services, no refund is available once the session is scheduled and confirmed within 48 hours of the session time.</p>
        <h3>9.2 Termination by BECS</h3>
        <p>BECS may terminate with 5 business days' written notice if Client fails to pay, materially breaches and fails to cure within 5 days, or engages in abusive, threatening, or harassing behavior. Upon BECS-initiated termination not caused by Client breach, BECS refunds a pro-rated portion of prepaid fees for work not yet performed.</p>
      `,
    },
    {
      id: "msa-independent",
      eyebrow: "10",
      title: "Independent Contractor",
      body: `
        <p>BECS is an independent contractor, not an employee, partner, joint venturer, or agent of Client. BECS may perform services for other clients during the term of this Agreement. BECS is solely responsible for its own taxes, insurance, and benefits.</p>
      `,
    },
    {
      id: "msa-dispute",
      eyebrow: "11",
      title: "Dispute Resolution",
      body: `
        <h3>11.0 Remedies / Cure Period</h3>
        <p>Before either Party initiates mediation, arbitration, or litigation, the Party seeking relief must give written notice and allow the other Party <strong>three hundred sixty-five (365) days</strong> to cure. No formal proceeding may be filed until the Cure Period expires, except where shorter timeframes are required by law.</p>
        <h3>11.1–11.3 Discussion → Mediation → Arbitration</h3>
        <p>Good-faith discussion (15 days) → non-binding mediation in Harris County, TX → binding arbitration under AAA or JAMS in Harris County, TX. Arbitrator's decision is final.</p>
        <h3>11.4 Exception</h3>
        <p>Either Party may seek emergency injunctive relief without first completing the above process where necessary to prevent irreparable harm.</p>
        <h3>11.5 No Class Actions</h3>
        <p>All disputes resolved on an individual basis only.</p>
      `,
    },
    {
      id: "msa-force-majeure",
      eyebrow: "12",
      title: "Force Majeure",
      body: `
        <p>Neither Party will be in breach for failures or delays caused by circumstances beyond reasonable control — natural disasters, war, terrorism, government actions, pandemics, internet outages, or other events making performance impractical. If the event persists more than <strong>30 days</strong>, either Party may terminate without penalty.</p>
      `,
    },
    {
      id: "msa-governing-law",
      eyebrow: "13",
      title: "Governing Law",
      body: `
        <p>This Agreement is governed by and construed in accordance with the laws of the <strong>State of Texas</strong>, without regard to conflict of law principles.</p>
      `,
    },
    {
      id: "msa-general",
      eyebrow: "14",
      title: "General Provisions",
      body: `
        <p><strong>14.1 Entire Agreement.</strong> This Agreement (including SOW or Addendum) is the entire agreement and supersedes prior discussions.</p>
        <p><strong>14.2 Amendments.</strong> Must be in writing and signed by both Parties.</p>
        <p><strong>14.3 Waiver.</strong> Failure to enforce any provision does not waive future enforcement.</p>
        <p><strong>14.4 Severability.</strong> Unenforceable provisions are severed; the rest continues in effect.</p>
        <p><strong>14.5 Notices.</strong> All notices in writing via email (with confirmation) or certified mail.</p>
        <p><strong>14.6 Electronic Signatures.</strong> Electronic signatures are binding under TUETA and the federal E-SIGN Act.</p>
      `,
    },
    {
      id: "msa-signatures",
      eyebrow: "15",
      title: "Signatures",
      body: `
        <p>By signing below, both Parties agree to the terms of this Master Service Agreement.</p>
        <table class="md-field-table">
          <tbody>
            <tr><th scope="row">BE Consulting Solutions</th><td>Brandon Ellis Bynum — Owner / Principal Consultant</td></tr>
            <tr><th scope="row">Client</th><td>{{CLIENT_NAME}}</td></tr>
          </tbody>
        </table>
      `,
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────
 * 2. Non-Circumvention & Exclusivity Addendum
 * ──────────────────────────────────────────────────────────────────── */
const ADDENDUM_NONCIRC: MasterDoc = {
  id: "addendum-noncirc",
  kind: "addendum",
  title: "Non-Circumvention & Exclusivity Addendum",
  heroEyebrow: "Addendum",
  heroHeadline: "Non-Circumvention & <em>Exclusivity</em> Addendum",
  heroSubline:
    "Attached to and executed alongside the Master Service Agreement. Protects the relationships, methods, and engaged scope BECS brings to this partnership.",
  defaultMeta: [
    { label: "Addendum Date", value: "{{ADDENDUM_DATE}}" },
    { label: "Client", value: "{{CLIENT_NAME}}" },
    { label: "Associated SOW", value: "{{SOW_REFERENCE}}" },
  ],
  source: "https://app.notion.com/p/3829c86eeaa281bab51ded06c9b00ea6",
  sections: [
    {
      id: "ad-purpose",
      eyebrow: "01",
      title: "Purpose & Good Faith",
      body: `
        <p>BECS and Client are entering into a working partnership in which BECS contributes proprietary frameworks, operating-system architecture, workflow design, vendor and partner relationships, referral networks, and specialized expertise. Both Parties acknowledge the value of this engagement depends on mutual good faith and the protection of the relationships and knowledge each Party brings. This Addendum protects that good faith — not to restrain ordinary business activity unrelated to the engagement.</p>
      `,
    },
    {
      id: "ad-noncirc",
      eyebrow: "02",
      title: "Non-Circumvention",
      body: `
        <h3>2.1 Protected Relationships</h3>
        <p>During the engagement and for <strong>twenty-four (24) months</strong> following its conclusion ("Restricted Period"), Client shall not circumvent or bypass BECS to engage directly or indirectly with any third party BECS introduces, identifies, sources, or facilitates an introduction to — contractors, subcontractors, developers, designers, vendors, software partners, referral partners, affiliates, suppliers, or any business contact (each a "BECS-Introduced Party").</p>
        <h3>2.2 Scope of Restriction</h3>
        <p>Without BECS's prior written consent, Client shall not, during the Restricted Period:</p>
        <ul>
          <li>Solicit, contract with, hire, or transact business directly with any BECS-Introduced Party for substantially similar services;</li>
          <li>Use a BECS-Introduced Party to replicate, rebuild, or replace deliverables or architecture BECS designed; or</li>
          <li>Induce, encourage, or assist any third party in circumventing BECS.</li>
        </ul>
        <h3>2.3 Exclusions</h3>
        <p>This Section does not apply to: (a) relationships Client can demonstrate, by written record, predate BECS's introduction; (b) parties Client independently identifies; or (c) general-availability software platforms (Notion, Supabase, QuickBooks, Stripe) used in the ordinary course, provided Client does not use them to circumvent BECS's design role.</p>
        <h3>2.4 Referral Acknowledgment</h3>
        <p>Client acknowledges BECS's introductions and partner relationships carry independent commercial value. Capturing that value by circumventing BECS during the Restricted Period is a material breach.</p>
      `,
    },
    {
      id: "ad-exclusivity",
      eyebrow: "03",
      title: "Exclusivity",
      body: `
        <h3>3.1 Engagement Exclusivity</h3>
        <p>For the duration of the active engagement, Client retains BECS as its <strong>exclusive provider</strong> for the specific category of services in the associated SOW. Client shall not engage another consultant, agency, or contractor for the same or substantially overlapping scope without BECS's prior written consent.</p>
        <h3>3.2 What Exclusivity Does Not Restrict</h3>
        <p>This exclusivity is narrowly limited to the engaged scope. It does <strong>not</strong> prevent Client from operating its own business, engaging professionals for unrelated services (legal, accounting, tax, HR, clinical, marketing creative), using internal staff, or engaging providers for clearly out-of-scope work.</p>
        <h3>3.3 Right of First Opportunity</h3>
        <p>During the engagement and within <strong>twelve (12) months</strong> after conclusion, Client agrees to first offer BECS a good-faith opportunity to scope and quote any expansion of the engaged category. BECS responds within <strong>ten (10) business days</strong>; if BECS declines or terms cannot be reached, Client may engage another provider.</p>
      `,
    },
    {
      id: "ad-remedies",
      eyebrow: "04",
      title: "Remedies",
      body: `
        <h3>4.1 Material Breach</h3>
        <p>A violation of Section 2 or Section 3 constitutes a material breach of the Agreement.</p>
        <h3>4.2 Injunctive Relief</h3>
        <p>The Parties agree a breach may cause BECS irreparable harm for which monetary damages alone are inadequate. BECS may seek emergency injunctive relief from a court of competent jurisdiction without first completing the cure period or dispute-resolution steps.</p>
        <h3>4.3 Recovery</h3>
        <p>In addition to other remedies, if Client circumvents BECS, Client pays the reasonable value of fees, commissions, or margin BECS would have earned, plus reasonable enforcement costs, to the extent permitted by applicable law.</p>
      `,
    },
    {
      id: "ad-severability",
      eyebrow: "05",
      title: "Reasonableness & Severability",
      body: `
        <p>The Parties agree the Restricted Period, geographic reach, and scope are reasonable and necessary to protect BECS's legitimate business interests. If any court finds a restriction unreasonable, it shall be modified to the maximum enforceable extent rather than voided; the remainder continues in full force.</p>
      `,
    },
    {
      id: "ad-relationship",
      eyebrow: "06",
      title: "Relationship to Master Service Agreement",
      body: `
        <p>All other MSA terms — governing law (Texas), confidentiality, IP, limitation of liability, dispute resolution — remain in full force and apply to this Addendum. Capitalized terms not defined here have the meanings given in the Agreement.</p>
      `,
    },
    {
      id: "ad-signatures",
      eyebrow: "07",
      title: "Signatures",
      body: `
        <p>By signing below, both Parties agree to the terms of this Non-Circumvention & Exclusivity Addendum.</p>
        <table class="md-field-table">
          <tbody>
            <tr><th scope="row">BE Consulting Solutions</th><td>Brandon Ellis Bynum — Owner / Principal Consultant</td></tr>
            <tr><th scope="row">Client</th><td>{{CLIENT_NAME}}</td></tr>
          </tbody>
        </table>
      `,
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────
 * 3. Non-Circumvention — Home Health Variant
 *    Same skeleton, healthcare-aware language additions.
 * ──────────────────────────────────────────────────────────────────── */
const ADDENDUM_HOME_HEALTH: MasterDoc = {
  ...ADDENDUM_NONCIRC,
  id: "addendum-noncirc-home-health",
  title: "Non-Circumvention & Exclusivity Addendum — Home Health Variant",
  heroSubline:
    "Healthcare variant for home-health and care-business engagements. Adds clinical-vendor protections to the standard Non-Circumvention & Exclusivity terms.",
  source: "https://app.notion.com/p/3849c86eeaa281088342d9eb22014b59",
  sections: [
    ...ADDENDUM_NONCIRC.sections.slice(0, 2),
    {
      id: "ad-hh-clinical",
      eyebrow: "02A",
      title: "Clinical Vendor Protections",
      body: `
        <p>For home-health and care-business engagements, "BECS-Introduced Party" expressly includes (without limitation) clinical staffing partners, licensed agencies, compliance consultants, EVV vendors, payor enrollment specialists, billing partners, and any care-coordination platforms BECS sources or facilitates introductions to.</p>
        <p>Client acknowledges these relationships are difficult and time-intensive to develop in healthcare and that circumventing BECS to engage them directly is the kind of harm Section 2 of this Addendum is designed to prevent.</p>
      `,
    },
    ...ADDENDUM_NONCIRC.sections.slice(2),
  ],
};

/* ────────────────────────────────────────────────────────────────────
 * 4. Client Onboarding — Welcome Packet
 *    Rendered for first-client welcome and for /portal/documents.
 * ──────────────────────────────────────────────────────────────────── */
const ONBOARDING_WELCOME: MasterDoc = {
  id: "onboarding-welcome",
  kind: "onboarding",
  title: "BECS Client Onboarding — Welcome Packet",
  heroEyebrow: "Welcome",
  heroHeadline: "Welcome to <em>BECS</em>, {{CLIENT_NAME}}",
  heroSubline:
    "You just made a decision most people put off for years: getting a clear, honest plan for your business. That's the hard part — and it's behind you. Here's exactly what happens next.",
  defaultMeta: [
    { label: "Client", value: "{{CLIENT_NAME}}" },
    { label: "Service Tier", value: "{{SERVICE_NAME}}" },
    { label: "Kickoff", value: "{{KICKOFF_DATE}}" },
    { label: "Owner", value: "Brandon Ellis Bynum" },
  ],
  source: "https://app.notion.com/p/3829c86eeaa2815ca07ffaae2bb20b29",
  sections: [
    {
      id: "wp-snapshot",
      eyebrow: "Engagement",
      title: "Engagement Snapshot",
      body: `
        <table class="md-field-table">
          <tbody>
            <tr><th scope="row">Client / Business</th><td>{{CLIENT_NAME}}</td></tr>
            <tr><th scope="row">Industry</th><td>{{INDUSTRY}}</td></tr>
            <tr><th scope="row">Service Tier</th><td>{{SERVICE_NAME}}</td></tr>
            <tr><th scope="row">P.E.S. Phase</th><td>PLAN · EVOLVE · SUCCEED</td></tr>
            <tr><th scope="row">SOW Reference</th><td>{{SOW_REFERENCE}}</td></tr>
            <tr><th scope="row">Kickoff Date</th><td>{{KICKOFF_DATE}}</td></tr>
            <tr><th scope="row">Owner</th><td>beconsultingsolutions@gmail.com</td></tr>
          </tbody>
        </table>
      `,
    },
    {
      id: "wp-step1",
      eyebrow: "Day 0 · within 24h",
      title: "Step 1 — Welcome",
      body: `
        <p>Goal: confirm you made the right call and tell you exactly what happens next. One clear next step, no overwhelm.</p>
        <ul>
          <li>Welcome email sent</li>
          <li>Intake form link delivered</li>
          <li>Calendly kickoff scheduling link delivered</li>
          <li>First payment / milestone invoice confirmed</li>
        </ul>
      `,
    },
    {
      id: "wp-step2",
      eyebrow: "Day 0–3",
      title: "Step 2 — Intake",
      body: `
        <p>Goal: diagnose before we prescribe. No work begins until intake is in.</p>
        <ul>
          <li>Intake responses received</li>
          <li>Gaps and red flags flagged</li>
          <li>B.E. Health Score scored where applicable</li>
          <li>Summary logged to your client record</li>
        </ul>
      `,
    },
    {
      id: "wp-step3",
      eyebrow: "Day 1–4",
      title: "Step 3 — Access & Assets",
      body: `
        <p>Goal: collect everything needed to deliver, before kickoff.</p>
        <ul>
          <li>Brand assets (logo, colors, fonts, collateral)</li>
          <li>Tool / account access as scoped</li>
          <li>Existing docs (current offers, pricing, prior plans)</li>
          <li>Scope boundaries confirmed against signed SOW</li>
        </ul>
      `,
    },
    {
      id: "wp-step4",
      eyebrow: "Day 3–7",
      title: "Step 4 — Kickoff",
      body: `
        <p>Goal: align on the destination, the milestones, and the rules of the road. 15 / 20 / 15 agenda:</p>
        <ol>
          <li><strong>Where you are + where you want to be</strong> (15m)</li>
          <li><strong>The plan</strong> — milestones, deliverables, timeline (20m)</li>
          <li><strong>How we'll work</strong> — communication cadence + your immediate next action (15m)</li>
        </ol>
      `,
    },
    {
      id: "wp-step5",
      eyebrow: "Ongoing",
      title: "Step 5 — Delivery Check-Ins",
      body: `
        <p>Goal: keep momentum, surface blockers early, build toward independence.</p>
        <ul>
          <li><strong>7-Day Check-In</strong> — first deliverable / quick win landed?</li>
          <li><strong>Mid-Engagement Review</strong> — on track to milestones? scope still accurate?</li>
          <li><strong>30-Day Check-In</strong> (longer tiers) — adoption and results review</li>
        </ul>
      `,
    },
    {
      id: "wp-step6",
      eyebrow: "Close",
      title: "Step 6 — Close & Handoff",
      body: `
        <p>Goal: end with you able to operate without us — and set up the next phase if it fits.</p>
        <ul>
          <li>Final deliverables + walkthrough recording</li>
          <li>Handoff doc / Loom so your team can run it</li>
          <li>Results recap vs. the metric that mattered</li>
          <li>Testimonial / referral ask</li>
          <li>Next P.E.S. phase or service tier where warranted</li>
        </ul>
      `,
    },
    {
      id: "wp-rules",
      eyebrow: "Operating",
      title: "How We Work",
      body: `
        <h3>Response cadence</h3>
        <p>BECS responds to portal messages within one business day. Client responds to BECS requests within 3–5 business days unless otherwise agreed.</p>
        <h3>Where things live</h3>
        <ul>
          <li><strong>This portal</strong> — your project, milestones, documents, and messages.</li>
          <li><strong>Signed PDFs</strong> — stored in Google Drive, linked from the Documents tab.</li>
          <li><strong>Scope changes</strong> — logged against the SOW before any work begins.</li>
        </ul>
      `,
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────
 * 5. Master Proposal — Canonical structure
 *    The proposal renderer can override section bodies from DB.
 * ──────────────────────────────────────────────────────────────────── */
const PROPOSAL_CANONICAL: MasterDoc = {
  id: "proposal-canonical",
  kind: "proposal",
  title: "BECS Master Proposal",
  heroEyebrow: "Proposal",
  heroHeadline: "{{HERO_HEADLINE}}",
  heroSubline: "{{HERO_SUBLINE}}",
  defaultMeta: [
    { label: "Prepared For", value: "{{CLIENT_NAME}}" },
    { label: "Industry", value: "{{INDUSTRY}}" },
    { label: "Location", value: "{{CLIENT_LOCATION}}" },
    { label: "Prepared By", value: "BE Consulting Solutions" },
  ],
  source: "https://app.notion.com/p/3879c86eeaa281a8bd49c85551f0552d",
  sections: [
    {
      id: "pr-problem",
      eyebrow: "01",
      title: "The Real Problem",
      body: `
        <p>{{CLIENT_NAME}} runs a {{CLIENT_BUSINESS_TYPE}} in {{CLIENT_LOCATION}}. The pattern we see in {{INDUSTRY}} businesses at this stage is a working operation that does not yet have a working <strong>system</strong> — the founder is the bottleneck, the offer mix is unclear, and growth feels like effort rather than leverage.</p>
        <p>Until the system is built, more marketing, more staff, and more hours all generate the same problem at a larger scale.</p>
      `,
    },
    {
      id: "pr-belief",
      eyebrow: "B.E.",
      title: "The B.E. Belief",
      body: `
        <p>Every business has a real problem worth solving and a real plan worth executing. Our job is to find both — fast — and build the system that lets you keep running them after we're gone.</p>
      `,
    },
    {
      id: "pr-pes",
      eyebrow: "02",
      title: "P.E.S. Framework",
      body: `
        <p>Every BECS engagement runs through three phases:</p>
        <ul>
          <li><strong>P — Plan.</strong> Diagnose the real problem and design the right system.</li>
          <li><strong>E — Evolve.</strong> Build, install, and operate the system inside your business.</li>
          <li><strong>S — Succeed.</strong> Hand off, measure, and set the next phase.</li>
        </ul>
      `,
    },
    {
      id: "pr-foundations",
      eyebrow: "03",
      title: "Three Foundations",
      body: `
        <p>For {{INDUSTRY}} businesses, the three foundations BECS protects in every engagement are:</p>
        <ol>
          <li><strong>Compliance & Confidence</strong> — the licensure, agreements, and infrastructure your business runs on legally.</li>
          <li><strong>Operating Cadence</strong> — the weekly rhythm that keeps cash, delivery, and people moving.</li>
          <li><strong>Offer Clarity</strong> — what you sell, to whom, at what price, and how the buyer says yes.</li>
        </ol>
      `,
    },
    {
      id: "pr-success",
      eyebrow: "04",
      title: "Initial Items of Success",
      body: `
        <p>By the end of this engagement, {{CLIENT_NAME}} will have:</p>
        <ul>
          <li>A documented offer + pricing model the team can quote without you.</li>
          <li>A weekly operating cadence with one owner per pillar.</li>
          <li>A signed compliance / licensure baseline appropriate to {{INDUSTRY}}.</li>
          <li>A 90-day milestone tracker tied to a single north-star metric.</li>
        </ul>
      `,
    },
    {
      id: "pr-tracker",
      eyebrow: "05",
      title: "Milestone Tracker / Measurables",
      body: `
        <table class="md-field-table">
          <thead><tr><th>Milestone</th><th>Target</th></tr></thead>
          <tbody>
            <tr><th scope="row">Kickoff</th><td>Day 0</td></tr>
            <tr><th scope="row">Foundation set</th><td>Day 30</td></tr>
            <tr><th scope="row">Operating cadence running</th><td>Day 60</td></tr>
            <tr><th scope="row">Handoff + measurement</th><td>Day 90</td></tr>
          </tbody>
        </table>
      `,
    },
    {
      id: "pr-30",
      eyebrow: "06",
      title: "First 30 Days — FOH / BOH",
      body: `
        <h3>Front of House (FOH)</h3>
        <ul>
          <li>Offer + pricing clarity</li>
          <li>Lead capture and follow-up</li>
          <li>Client-facing messaging</li>
        </ul>
        <h3>Back of House (BOH)</h3>
        <ul>
          <li>Operating cadence + accountability</li>
          <li>Compliance baseline for {{INDUSTRY}}</li>
          <li>Reporting and measurement</li>
        </ul>
      `,
    },
    {
      id: "pr-timeline",
      eyebrow: "07",
      title: "Timeline",
      body: `
        <p>Engagement runs in 30-day arcs: <strong>Diagnose → Build → Install → Hand off.</strong> Most milestones are designed to land within a 90-day window. Longer engagements add a 30-day check-in arc.</p>
      `,
    },
    {
      id: "pr-investment",
      eyebrow: "08",
      title: "Investment",
      body: `
        <p>Retainer investment: <strong>{{RETAINER_PRICE}}</strong>. Non-refundable deposit due on signing. Remaining installments per the attached SOW schedule.</p>
        <p>Hybrid arrangements — fixed milestone + monthly retainer — are available where they better fit the work.</p>
      `,
    },
    {
      id: "pr-next",
      eyebrow: "09",
      title: "Next Step",
      body: `
        <p>If this lands, sign at the bottom and book your kickoff. BECS will counter-sign within one business day, send the welcome packet, and you'll have everything you need to start.</p>
      `,
    },
    {
      id: "pr-noncirc",
      eyebrow: "10",
      title: "Special Case / Non-Circumvention",
      body: `
        <p>This engagement is accompanied by the Non-Circumvention & Exclusivity Addendum{{INDUSTRY_ALT}}. It protects the relationships and methods BECS brings; ordinary business activity unrelated to the engaged scope is not restricted.</p>
      `,
    },
    {
      id: "pr-nda",
      eyebrow: "11",
      title: "Mutual NDA",
      body: `
        <p>Confidentiality is covered by Section 7 of the Master Service Agreement. Information shared by either Party in connection with this engagement is treated as confidential and survives termination for three (3) years.</p>
      `,
    },
    {
      id: "pr-roles",
      eyebrow: "12",
      title: "Roles & Responsibilities",
      body: `
        <table class="md-field-table">
          <tbody>
            <tr><th scope="row">BECS</th><td>Diagnose, design, build, install, hand off. Single point of accountability through Brandon Ellis Bynum.</td></tr>
            <tr><th scope="row">Client</th><td>Provide access, decisions, and timely feedback. Single point of contact with authority.</td></tr>
          </tbody>
        </table>
      `,
    },
    {
      id: "pr-disclaimer",
      eyebrow: "13",
      title: "Non-Guarantee & Liability",
      body: `
        <p>BECS provides strategic guidance and execution. Results depend on Client effort, market conditions, and implementation. BECS does not guarantee specific revenue, ROI, capital access, or earnings. Liability is capped per Section 8 of the Master Service Agreement.</p>
      `,
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────
 * 6. Terms of Service — public site
 * ──────────────────────────────────────────────────────────────────── */
const TOS: MasterDoc = {
  id: "tos",
  kind: "policy",
  title: "Terms of Service",
  heroEyebrow: "Policy",
  heroHeadline: "BECS <em>Terms of Service</em>",
  heroSubline:
    "These terms govern your use of thebeconsultingsolution.com and any BECS-hosted application. They do not replace the Master Service Agreement that governs paid engagements.",
  defaultMeta: [{ label: "Effective Date", value: "{{EFFECTIVE_DATE}}" }],
  sections: [
    {
      id: "tos-acceptance",
      eyebrow: "01",
      title: "Acceptance of Terms",
      body: `<p>By accessing the site or platform you agree to these Terms. If you do not agree, do not use the site.</p>`,
    },
    {
      id: "tos-use",
      eyebrow: "02",
      title: "Permitted Use",
      body: `<p>The site is provided for informational and engagement-management purposes. Do not scrape, reverse-engineer, or attempt to circumvent access controls.</p>`,
    },
    {
      id: "tos-ip",
      eyebrow: "03",
      title: "Intellectual Property",
      body: `<p>All site content, frameworks, and methodologies are BECS IP. Limited use is granted only as set out in a signed MSA.</p>`,
    },
    {
      id: "tos-liability",
      eyebrow: "04",
      title: "Limitation of Liability",
      body: `<p>The site is provided "as is" without warranty. To the maximum extent permitted by law, BECS is not liable for indirect or consequential damages arising from use of the site.</p>`,
    },
    {
      id: "tos-law",
      eyebrow: "05",
      title: "Governing Law",
      body: `<p>These Terms are governed by the laws of the State of Texas.</p>`,
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────
 * 7. Privacy Policy — public site
 * ──────────────────────────────────────────────────────────────────── */
const PRIVACY: MasterDoc = {
  id: "privacy",
  kind: "policy",
  title: "Privacy Policy",
  heroEyebrow: "Policy",
  heroHeadline: "BECS <em>Privacy Policy</em>",
  heroSubline:
    "What we collect, how we use it, and how we protect it. Client data inside the BECS portal is covered additionally by the MSA's confidentiality terms.",
  defaultMeta: [{ label: "Effective Date", value: "{{EFFECTIVE_DATE}}" }],
  sections: [
    {
      id: "pp-collect",
      eyebrow: "01",
      title: "What We Collect",
      body: `<p>Contact details you submit (name, email, business name, phone), engagement data inside the portal, and standard web analytics (page views, device type).</p>`,
    },
    {
      id: "pp-use",
      eyebrow: "02",
      title: "How We Use It",
      body: `<p>To deliver services, communicate about your engagement, improve the platform, and comply with legal obligations. We do not sell personal data.</p>`,
    },
    {
      id: "pp-share",
      eyebrow: "03",
      title: "Third-Party Disclosures",
      body: `<p>We use Supabase (database, auth), Netlify (hosting), and QuickBooks (invoicing). Each is bound by its own data-handling commitments.</p>`,
    },
    {
      id: "pp-rights",
      eyebrow: "04",
      title: "Your Rights",
      body: `<p>You may request access, correction, or deletion of your data by emailing beconsultingsolutions@gmail.com.</p>`,
    },
    {
      id: "pp-retention",
      eyebrow: "05",
      title: "Retention",
      body: `<p>Engagement data is retained for the longer of (a) the duration of the engagement plus seven years, or (b) the period required by applicable law.</p>`,
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────
 * Registry
 * ──────────────────────────────────────────────────────────────────── */
export const MASTER_DOC_REGISTRY: Record<MasterDocId, MasterDoc> = {
  msa: MSA,
  "addendum-noncirc": ADDENDUM_NONCIRC,
  "addendum-noncirc-home-health": ADDENDUM_HOME_HEALTH,
  "onboarding-welcome": ONBOARDING_WELCOME,
  "proposal-canonical": PROPOSAL_CANONICAL,
  tos: TOS,
  privacy: PRIVACY,
};

export function getMasterDoc(id: MasterDocId): MasterDoc {
  return MASTER_DOC_REGISTRY[id];
}

export type TokenMap = Record<string, string | undefined | null>;

/**
 * Replace {{TOKEN}} occurrences in a string with values from `tokens`. Tokens
 * without a value are left visible so the gap is obvious in QA.
 */
export function replaceTokens(input: string, tokens: TokenMap | undefined): string {
  if (!tokens) return input;
  return input.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key: string) => {
    const v = tokens[key];
    if (v === undefined || v === null || v === "") return match;
    return String(v);
  });
}
