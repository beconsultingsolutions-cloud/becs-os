import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Lightbulb,
  BookOpen,
  Users,
  GitBranch,
  LayoutDashboard,
  UserPlus,
  FolderKanban,
  CalendarDays,
  FileText,
  Scale,
  ClipboardList,
  Zap,
  Shield,
  Globe,
  Star,
  Building2,
  ArrowRight,
  CheckCheck,
  Eye,
  Send,
  Handshake,
  Rocket,
  Trophy,
  RefreshCw,
  PhoneCall,
  FileCheck,
  GraduationCap,
  Lock,
} from "lucide-react";

// ─── Brand Colors ──────────────────────────────────────────────────────────
const GREEN = "#A2D652";
const DARK_BLUE = "#26296A";
const LIGHT_GREEN = "#D8F4C1";
const GRAY_BLUE = "#A1B4C4";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Module {
  id: string;
  number: number;
  title: string;
  icon: React.ReactNode;
  estimatedMinutes: number;
  content: React.ReactNode;
}

// ─── Reusable Components ───────────────────────────────────────────────────

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex gap-3 rounded-lg p-4 my-4"
      style={{ background: LIGHT_GREEN, borderLeft: `3px solid ${GREEN}` }}
    >
      <Lightbulb size={16} className="mt-0.5 shrink-0" style={{ color: DARK_BLUE }} />
      <p className="text-sm leading-relaxed" style={{ color: DARK_BLUE, maxWidth: "none" }}>
        {children}
      </p>
    </div>
  );
}

function InfoBox({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div
      className="rounded-lg p-4 my-4"
      style={{ background: "#EEF2FF", borderLeft: `3px solid ${DARK_BLUE}` }}
    >
      {title && (
        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: DARK_BLUE }}>
          {title}
        </p>
      )}
      <div className="text-sm leading-relaxed text-gray-700">{children}</div>
    </div>
  );
}

function StepBadge({ number }: { number: number }) {
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 mt-0.5"
      style={{ background: DARK_BLUE, color: "white" }}
    >
      {number}
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-semibold text-base mb-2 mt-5" style={{ color: DARK_BLUE }}>
      {children}
    </h3>
  );
}

function BulletList({ items }: { items: (string | React.ReactNode)[] }) {
  return (
    <ul className="space-y-1.5 my-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-gray-700">
          <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: GREEN }} />
          <span style={{ maxWidth: "none" }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-1 mb-1"
      style={{ background: `${color}20`, color }}
    >
      {label}
    </span>
  );
}

function PESStep({
  number,
  title,
  icon,
  color,
  children,
}: {
  number: number;
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border overflow-hidden mb-2" style={{ borderColor: "#E5E7EB" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span
          className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
          style={{ background: `${color}20` }}
        >
          <span style={{ color }}>{icon}</span>
        </span>
        <span className="flex-1">
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: GRAY_BLUE }}
          >
            Step {number}
          </span>
          <p className="font-semibold text-sm" style={{ color: DARK_BLUE }}>
            {title}
          </p>
        </span>
        {open ? (
          <ChevronUp size={16} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-sm text-gray-700 border-t" style={{ borderColor: "#F3F4F6" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function PageGuideCard({
  icon,
  title,
  description,
  details,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  details: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border mb-3 overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span
          className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
          style={{ background: `${DARK_BLUE}15` }}
        >
          <span style={{ color: DARK_BLUE }}>{icon}</span>
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: DARK_BLUE }}>
            {title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{description}</p>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-700 border-t" style={{ borderColor: "#F3F4F6" }}>
          {details}
        </div>
      )}
    </div>
  );
}

// ─── Admin Module Content ──────────────────────────────────────────────────

function Module1Content() {
  return (
    <div>
      <SectionHeading>Logging In</SectionHeading>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 text-sm">
          <StepBadge number={1} />
          <div>
            <span>Navigate to </span>
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono" style={{ color: DARK_BLUE }}>
              thebecs.netlify.app
            </code>
          </div>
        </div>
        <div className="flex gap-2 text-sm">
          <StepBadge number={2} />
          <span>Enter your email address and password on the login screen.</span>
        </div>
        <div className="flex gap-2 text-sm">
          <StepBadge number={3} />
          <span>
            You'll be redirected to the Control Tower (Dashboard) for your default entity. If you have
            access to multiple entities, use the entity switcher to change context.
          </span>
        </div>
      </div>
      <TipBox>
        Always confirm you're in the correct entity before taking any action. The entity name appears
        prominently in the top-left of the sidebar.
      </TipBox>

      <SectionHeading>The Control Tower — Dashboard Overview</SectionHeading>
      <p className="text-sm text-gray-700 mb-3">
        The Dashboard is your command center. At a glance it shows everything happening across your
        entity's pipeline.
      </p>
      <BulletList
        items={[
          <><strong>Stat Cards (top row)</strong> — Total Leads, New Leads, Active Clients, Active Projects, Scheduled Meetings, Revenue Collected</>,
          <><strong>Recent Leads panel</strong> — Last 5 leads captured, with status badges and quick-view info</>,
          <><strong>Active Projects panel</strong> — In-flight projects with progress bars and client names</>,
          <><strong>Upcoming Meetings panel</strong> — Scheduled meetings sorted by date, with type and client link</>,
          <><strong>Automation Feed panel</strong> — Latest system events (lead captures, status changes, onboarding actions)</>,
          <><strong>P.E.S. Lifecycle pipeline</strong> — Visual representation of leads moving through each stage of the workflow</>,
        ]}
      />

      <SectionHeading>Sidebar Navigation</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        {[
          { icon: <LayoutDashboard size={14} />, label: "Dashboard", desc: "Control Tower overview" },
          { icon: <UserPlus size={14} />, label: "Leads", desc: "Lead pipeline management" },
          { icon: <Users size={14} />, label: "Clients", desc: "Client directory & detail" },
          { icon: <FolderKanban size={14} />, label: "Projects", desc: "Project tracking & progress" },
          { icon: <CalendarDays size={14} />, label: "Meetings", desc: "Schedule & track meetings" },
          { icon: <FileText size={14} />, label: "Proposals", desc: "Proposals & pricing" },
          { icon: <Scale size={14} />, label: "Legal & Docs", desc: "Contracts, NDAs, invoices" },
          { icon: <ClipboardList size={14} />, label: "Recaps", desc: "Session & project recaps" },
          { icon: <Zap size={14} />, label: "Automation Log", desc: "System event timeline" },
          { icon: <GraduationCap size={14} />, label: "Training", desc: "This guide" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded-md p-2"
            style={{ background: "#F8FAFC" }}
          >
            <span style={{ color: DARK_BLUE }}>{item.icon}</span>
            <div>
              <p className="text-xs font-semibold" style={{ color: DARK_BLUE }}>
                {item.label}
              </p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Module2Content() {
  return (
    <div>
      <SectionHeading>What Are Entities?</SectionHeading>
      <p className="text-sm text-gray-700 mb-3">
        An entity is a distinct business or brand operated within the BECS OS portal. Each entity has its
        own completely isolated data — leads, clients, projects, meetings, and documents are siloed per
        entity at the database level.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        {[
          { name: "BECS", desc: "The core BECS consulting brand — primary entity for most work", color: DARK_BLUE },
          { name: "Lane Ellis Apparel Agency", desc: "Fashion & apparel consulting arm — separate lead pool and clients", color: "#7C3AED" },
          { name: "Me and Them", desc: "Secondary brand entity — independent pipeline and projects", color: "#0891B2" },
        ].map((e) => (
          <div
            key={e.name}
            className="rounded-lg p-3 border"
            style={{ borderColor: `${e.color}40`, background: `${e.color}08` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={14} style={{ color: e.color }} />
              <span className="font-semibold text-sm" style={{ color: e.color }}>
                {e.name}
              </span>
            </div>
            <p className="text-xs text-gray-600">{e.desc}</p>
          </div>
        ))}
      </div>

      <SectionHeading>How to Switch Entities</SectionHeading>
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex gap-2 text-sm">
          <StepBadge number={1} />
          <span>Look at the top-left corner of the sidebar. The current entity name is displayed there with a dropdown arrow.</span>
        </div>
        <div className="flex gap-2 text-sm">
          <StepBadge number={2} />
          <span>Click the entity name to open the entity switcher dropdown.</span>
        </div>
        <div className="flex gap-2 text-sm">
          <StepBadge number={3} />
          <span>Select the entity you want to work in. The page will reload with that entity's data.</span>
        </div>
      </div>

      <InfoBox title="Critical — Data Isolation">
        Switching entities immediately filters ALL data across every single page. Leads, clients,
        projects, meetings, proposals, legal documents, recaps, and automation logs all change to reflect
        only the selected entity's records. You cannot accidentally see or modify another entity's data
        while inside a different entity context.
      </InfoBox>

      <SectionHeading>When to Use Each Entity</SectionHeading>
      <BulletList
        items={[
          "Use BECS for all consulting engagements under the main BECS brand",
          "Use Lane Ellis Apparel Agency for fashion/apparel clients and leads",
          "Use Me and Them for that brand's specific client work and pipeline",
          "When in doubt — if the client came in through a specific brand's intake form, that's the entity to use",
        ]}
      />
      <TipBox>
        Super admins and admins can see all entities. Staff, coaches, and viewers are restricted to only
        the entities they've been assigned access to.
      </TipBox>
    </div>
  );
}

function Module3Content() {
  const steps = [
    {
      number: 1,
      title: "Lead Capture",
      icon: <UserPlus size={16} />,
      color: "#6366F1",
      content: (
        <div className="space-y-2 mt-2">
          <p>Leads enter the system in two ways:</p>
          <BulletList
            items={[
              <><strong>Automatic (preferred)</strong> — Website intake forms powered by FormSubmit automatically create lead records. The email scanner runs hourly and processes new submissions.</>,
              <><strong>Manual</strong> — Click "+ New Lead" on the Leads page to add a lead directly.</>,
            ]}
          />
          <p className="font-medium text-xs uppercase tracking-wider mt-3 mb-1" style={{ color: GRAY_BLUE }}>Fields captured:</p>
          <div className="flex flex-wrap gap-1">
            {["Name", "Business Name", "Email", "Phone", "Service Interest", "Business Stage", "Goals", "Pain Points", "Budget", "Referral Source", "Lead Source"].map((f) => (
              <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{f}</span>
            ))}
          </div>
        </div>
      ),
    },
    {
      number: 2,
      title: "Qualification",
      icon: <Eye size={16} />,
      color: "#F59E0B",
      content: (
        <div className="space-y-2 mt-2">
          <p>Review each lead and assess whether they're a good fit for BECS services.</p>
          <p className="font-medium text-xs uppercase tracking-wider mt-2 mb-1" style={{ color: GRAY_BLUE }}>Status progression:</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {[
              { s: "new", c: "#6B7280" },
              { s: "reviewing", c: "#3B82F6" },
              { s: "discovery", c: "#8B5CF6" },
              { s: "assessment", c: "#F59E0B" },
            ].map(({ s, c }) => <StatusBadge key={s} label={s} color={c} />)}
          </div>
          <BulletList
            items={[
              "Add qualification notes to document what you've learned about the lead",
              "Set the recommended path: A (immediate fit), B (good fit, needs nurturing), C (not right now), D (not a fit)",
              "Add next steps so nothing falls through the cracks",
            ]}
          />
        </div>
      ),
    },
    {
      number: 3,
      title: "Proposal",
      icon: <Send size={16} />,
      color: "#0EA5E9",
      content: (
        <div className="space-y-2 mt-2">
          <p>Create a proposal linked to the qualified lead. Proposals live on the Proposals page.</p>
          <p className="font-medium text-xs uppercase tracking-wider mt-2 mb-1" style={{ color: GRAY_BLUE }}>Service types:</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {["Reality Check", "Foundation Builder", "Business Launch", "Retainer", "Add-On"].map((s) => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${DARK_BLUE}15`, color: DARK_BLUE }}>{s}</span>
            ))}
          </div>
          <p className="font-medium text-xs uppercase tracking-wider mt-2 mb-1" style={{ color: GRAY_BLUE }}>Proposal status flow:</p>
          <div className="flex items-center gap-1 flex-wrap">
            {["draft", "sent", "viewed", "accepted"].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-1">
                <StatusBadge
                  label={s}
                  color={s === "accepted" ? "#22C55E" : s === "viewed" ? "#F59E0B" : s === "sent" ? "#3B82F6" : "#6B7280"}
                />
                {i < arr.length - 1 && <ArrowRight size={10} className="text-gray-400" />}
              </span>
            ))}
            <span className="text-gray-400 text-xs">or</span>
            <StatusBadge label="declined" color="#EF4444" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Set scope, price, timeline, deliverables, and whether an NDA is required before sending.</p>
        </div>
      ),
    },
    {
      number: 4,
      title: "Contract & Pay",
      icon: <FileCheck size={16} />,
      color: "#10B981",
      content: (
        <div className="space-y-2 mt-2">
          <p>Create and track all legal documents from the Legal & Docs page.</p>
          <p className="font-medium text-xs uppercase tracking-wider mt-2 mb-1" style={{ color: GRAY_BLUE }}>Document types:</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {["NDA", "Agreement", "SOW", "Invoice", "Change Order", "Completion Certificate"].map((d) => (
              <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{d}</span>
            ))}
          </div>
          <p className="font-medium text-xs uppercase tracking-wider mt-2 mb-1" style={{ color: GRAY_BLUE }}>Document status flow:</p>
          <div className="flex items-center gap-1 flex-wrap">
            {["draft", "sent", "signed", "paid"].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-1">
                <StatusBadge
                  label={s}
                  color={s === "paid" ? "#22C55E" : s === "signed" ? "#10B981" : s === "sent" ? "#3B82F6" : "#6B7280"}
                />
                {i < arr.length - 1 && <ArrowRight size={10} className="text-gray-400" />}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Link documents to clients and set payment amounts to track revenue on the Dashboard.</p>
        </div>
      ),
    },
    {
      number: 5,
      title: "Onboarding",
      icon: <Handshake size={16} />,
      color: "#8B5CF6",
      content: (
        <div className="space-y-2 mt-2">
          <p>Once a lead is qualified and contracted, convert them to a client on the Clients page.</p>
          <BulletList
            items={[
              <>A unique client ID is auto-generated in the format <code className="bg-gray-100 px-1 rounded text-xs">BECS-C-XXX</code></>,
              "Set the client's portal access level and initial status (active)",
              "Track onboarding completion — mark the onboarding checklist as complete when done",
              "The lead record is preserved for historical reference — both records coexist",
            ]}
          />
          <TipBox>
            Create an onboarding recap immediately after the first client meeting. This sets the tone and gives the client a reference document.
          </TipBox>
        </div>
      ),
    },
    {
      number: 6,
      title: "Delivery",
      icon: <Rocket size={16} />,
      color: "#F97316",
      content: (
        <div className="space-y-2 mt-2">
          <p>Create a project on the Projects page to track active delivery work.</p>
          <BulletList
            items={[
              "Link the project to the client's record",
              "Set service type (must match what was proposed and contracted)",
              "Update the progress percentage as work completes — this drives the Dashboard's active project view",
              "Add milestones to break the project into trackable phases",
              "Set start and projected end dates for timeline visibility",
            ]}
          />
          <p className="font-medium text-xs uppercase tracking-wider mt-2 mb-1" style={{ color: GRAY_BLUE }}>Project statuses:</p>
          <div className="flex flex-wrap gap-1">
            {[
              { s: "active", c: "#22C55E" },
              { s: "paused", c: "#F59E0B" },
              { s: "completed", c: "#3B82F6" },
            ].map(({ s, c }) => <StatusBadge key={s} label={s} color={c} />)}
          </div>
        </div>
      ),
    },
    {
      number: 7,
      title: "Completion",
      icon: <Trophy size={16} />,
      color: "#EAB308",
      content: (
        <div className="space-y-2 mt-2">
          <p>Generate recaps from the Recaps page to document the completed work.</p>
          <p className="font-medium text-xs uppercase tracking-wider mt-2 mb-1" style={{ color: GRAY_BLUE }}>Recap types:</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {["Intake", "Onboarding", "Discovery", "Milestone", "Project", "Completion", "Admin Snapshot"].map((r) => (
              <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{r}</span>
            ))}
          </div>
          <BulletList
            items={[
              "Link each recap to the appropriate client",
              "Add detailed content — this is the client-facing record of what was accomplished",
              "The summary field surfaces on the client detail page",
              "Mark the project as completed and generate a Completion Certificate in Legal & Docs",
            ]}
          />
        </div>
      ),
    },
    {
      number: 8,
      title: "Expand",
      icon: <RefreshCw size={16} />,
      color: "#A2D652",
      content: (
        <div className="space-y-2 mt-2">
          <p>
            After project completion, the relationship doesn't end — it evolves. Use the Automation Log and
            client history to identify re-engagement opportunities.
          </p>
          <BulletList
            items={[
              "Review the Automation Log for re-engagement triggers (e.g., a past client submitting a new intake form)",
              "Check when clients completed their last project and proactively reach out",
              "Offer retainer packages or add-on services based on what you know about their business",
              "Use the Recaps from previous engagements to craft personalized follow-up",
            ]}
          />
          <TipBox>
            The best new business is a returning client. Budget 20 minutes per week to scan completed projects
            and identify who might be ready for the next phase.
          </TipBox>
        </div>
      ),
    },
  ];

  return (
    <div>
      <p className="text-sm text-gray-700 mb-4">
        The P.E.S. Lifecycle (Prospect → Engage → Serve) is the core workflow of the BECS OS portal. Every
        client relationship follows this 8-step path. Each step below is expandable — click to see exactly
        what to do and how the system supports it.
      </p>

      <div
        className="flex items-center gap-1 flex-wrap mb-4 p-3 rounded-lg text-xs font-medium"
        style={{ background: `${DARK_BLUE}08` }}
      >
        {steps.map((step, i) => (
          <span key={step.number} className="flex items-center gap-1">
            <span style={{ color: step.color }}>{step.title}</span>
            {i < steps.length - 1 && <ArrowRight size={10} className="text-gray-300" />}
          </span>
        ))}
      </div>

      {steps.map((step) => (
        <PESStep key={step.number} number={step.number} title={step.title} icon={step.icon} color={step.color}>
          {step.content}
        </PESStep>
      ))}
    </div>
  );
}

function Module4Content() {
  const pages = [
    {
      icon: <LayoutDashboard size={16} />,
      title: "Dashboard — Control Tower",
      description: "Command center with stat cards, recent activity, and P.E.S. pipeline",
      details: (
        <div className="space-y-3 mt-3">
          <p>Your starting point every day. The Dashboard gives you the full picture of what's happening in the current entity.</p>
          <SectionHeading>What You'll See</SectionHeading>
          <BulletList
            items={[
              <><strong>6 Stat Cards:</strong> Total Leads, New Leads (unreviewed), Active Clients, Active Projects, Scheduled Meetings, Revenue (from paid documents)</>,
              <><strong>Recent Leads:</strong> The last 5 leads captured — click any to open the Leads page</>,
              <><strong>Active Projects:</strong> In-flight projects with visual progress bars and client names</>,
              <><strong>Upcoming Meetings:</strong> Scheduled meetings sorted chronologically with type and client</>,
              <><strong>Automation Feed:</strong> Real-time log of the last system events for the entity</>,
              <><strong>P.E.S. Lifecycle:</strong> Visual pipeline showing how many leads/clients are at each stage</>,
            ]}
          />
          <TipBox>Check the Dashboard every morning. If new leads appeared overnight (via the hourly email scanner), they'll show in the "New Leads" stat and the Recent Leads panel.</TipBox>
        </div>
      ),
    },
    {
      icon: <UserPlus size={16} />,
      title: "Leads — Pipeline Management",
      description: "Full lead management with status workflow and filters",
      details: (
        <div className="space-y-3 mt-3">
          <p>The Leads page is where all prospect management happens. Leads are the top of the P.E.S. funnel.</p>
          <SectionHeading>Key Actions</SectionHeading>
          <BulletList
            items={[
              <>Click <strong>"+ New Lead"</strong> to add a lead manually</>,
              "Use the search bar to find leads by name, business, or email",
              "Filter by status using the status filter buttons",
              "Click any lead card to expand it and edit all fields",
            ]}
          />
          <SectionHeading>Lead Statuses</SectionHeading>
          <div className="flex flex-wrap gap-1 mb-2">
            {[
              { s: "new", c: "#6B7280" },
              { s: "reviewing", c: "#3B82F6" },
              { s: "discovery", c: "#8B5CF6" },
              { s: "assessment", c: "#F59E0B" },
              { s: "proposal", c: "#0EA5E9" },
              { s: "nurture", c: "#10B981" },
              { s: "not_fit", c: "#EF4444" },
            ].map(({ s, c }) => <StatusBadge key={s} label={s} color={c} />)}
          </div>
          <SectionHeading>Lead Sources</SectionHeading>
          <div className="flex flex-wrap gap-1">
            {["website", "referral", "LinkedIn", "speaking", "direct", "QR code", "email", "returning"].map((src) => (
              <span key={src} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{src}</span>
            ))}
          </div>
          <TipBox>Move leads to "nurture" instead of deleting them if they're not ready now. Set a follow-up note — they may come back in 3-6 months.</TipBox>
        </div>
      ),
    },
    {
      icon: <Users size={16} />,
      title: "Clients — Client Directory",
      description: "Client records with full history, portal access, and detail views",
      details: (
        <div className="space-y-3 mt-3">
          <p>The Clients page is the source of truth for all active and past client relationships.</p>
          <SectionHeading>Key Features</SectionHeading>
          <BulletList
            items={[
              "Search clients by name, business, or client ID",
              "Click any client card to open the Client Detail page — a full profile with all associated records",
              <>Create new clients with the <strong>"+ New Client"</strong> button. IDs are auto-generated as <code className="bg-gray-100 px-1 rounded text-xs">BECS-C-XXX</code></>,
              "Track onboarding completion status directly on the card",
              "See portal access status — whether the client can log in to view their own portal",
            ]}
          />
          <SectionHeading>Client Statuses</SectionHeading>
          <div className="flex flex-wrap gap-1">
            {[
              { s: "active", c: "#22C55E" },
              { s: "inactive", c: "#F59E0B" },
              { s: "churned", c: "#EF4444" },
            ].map(({ s, c }) => <StatusBadge key={s} label={s} color={c} />)}
          </div>
          <InfoBox title="Client Detail Page">
            Clicking a client card opens a full detail view showing: contact info, associated projects,
            meeting history, proposals, legal documents, and recaps — all in one place. This is the most
            comprehensive view of any client relationship in the system.
          </InfoBox>
        </div>
      ),
    },
    {
      icon: <FolderKanban size={16} />,
      title: "Projects — Delivery Tracking",
      description: "All active and historical projects with progress and milestones",
      details: (
        <div className="space-y-3 mt-3">
          <p>Projects track the actual delivery work for each client engagement.</p>
          <SectionHeading>Project List View</SectionHeading>
          <BulletList
            items={[
              "Projects are grouped by status: Active first, then paused, then completed",
              "Each project card shows: service type badge, progress bar, client name, start/end dates",
              "Progress percentage is set manually as work completes — update it regularly",
              "Click a project to edit details, add milestones, or change status",
            ]}
          />
          <SectionHeading>Service Types</SectionHeading>
          <div className="flex flex-wrap gap-1">
            {["Reality Check", "Foundation Builder", "Business Launch", "Retainer", "Add-On"].map((s) => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${DARK_BLUE}15`, color: DARK_BLUE }}>{s}</span>
            ))}
          </div>
          <TipBox>
            Update project progress every time you complete a major task or deliverable. Accurate progress keeps the
            Dashboard stats meaningful and shows clients real momentum.
          </TipBox>
        </div>
      ),
    },
    {
      icon: <CalendarDays size={16} />,
      title: "Meetings — Scheduling & Tracking",
      description: "Schedule, track, and document all client meetings",
      details: (
        <div className="space-y-3 mt-3">
          <p>Meetings are linked to clients and tracked with types, outcomes, and notes.</p>
          <SectionHeading>Meeting Types</SectionHeading>
          <div className="flex flex-wrap gap-1 mb-2">
            {["discovery", "kickoff", "strategy", "check-in", "milestone review", "final", "follow-up"].map((t) => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{t}</span>
            ))}
          </div>
          <SectionHeading>Meeting Statuses</SectionHeading>
          <div className="flex flex-wrap gap-1 mb-2">
            {[
              { s: "scheduled", c: "#3B82F6" },
              { s: "completed", c: "#22C55E" },
              { s: "cancelled", c: "#EF4444" },
              { s: "rescheduled", c: "#F59E0B" },
            ].map(({ s, c }) => <StatusBadge key={s} label={s} color={c} />)}
          </div>
          <SectionHeading>Fields to Track</SectionHeading>
          <BulletList
            items={[
              "Link to client record (required)",
              "Meeting type, date/time, and duration",
              "Notes — add these immediately after the meeting while details are fresh",
              "Status — update to completed when done, or rescheduled if it moved",
            ]}
          />
          <TipBox>Always update meeting status to "completed" after it happens. Scheduled meetings count toward the Dashboard stat — leaving them as scheduled after the meeting skews your numbers.</TipBox>
        </div>
      ),
    },
    {
      icon: <FileText size={16} />,
      title: "Proposals — Pricing & Scope",
      description: "Create and track proposals through the sales cycle",
      details: (
        <div className="space-y-3 mt-3">
          <p>Proposals are the bridge between qualification and contracting. They capture what you're offering and at what price.</p>
          <SectionHeading>Creating a Proposal</SectionHeading>
          <BulletList
            items={[
              "Link the proposal to the qualifying lead record",
              "Select service type and specify the scope in detail",
              "Set price, timeline, and list all deliverables",
              "Indicate whether an NDA is required before work begins",
              "Change status to 'sent' when the proposal goes to the prospect",
            ]}
          />
          <SectionHeading>Status Flow</SectionHeading>
          <div className="flex items-center gap-1 flex-wrap mb-2">
            {["draft", "sent", "viewed", "accepted"].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-1">
                <StatusBadge
                  label={s}
                  color={s === "accepted" ? "#22C55E" : s === "viewed" ? "#F59E0B" : s === "sent" ? "#3B82F6" : "#6B7280"}
                />
                {i < arr.length - 1 && <ArrowRight size={10} className="text-gray-400" />}
              </span>
            ))}
          </div>
          <TipBox>When a proposal is accepted, immediately create the corresponding Legal & Docs records (NDA if required, then Agreement/SOW, then Invoice). Don't let momentum die.</TipBox>
        </div>
      ),
    },
    {
      icon: <Scale size={16} />,
      title: "Legal & Docs — Document Management",
      description: "NDAs, agreements, SOWs, invoices, and completion certificates",
      details: (
        <div className="space-y-3 mt-3">
          <p>All legal and financial documents for client relationships live here. This page directly feeds the revenue figures on the Dashboard.</p>
          <SectionHeading>Document Types & When to Use Them</SectionHeading>
          <BulletList
            items={[
              <><strong>NDA</strong> — Before any sensitive business discussions. Create first if required.</>,
              <><strong>Agreement</strong> — The master service agreement. Create after proposal acceptance.</>,
              <><strong>SOW (Statement of Work)</strong> — Detailed scope document. Use for complex or multi-phase projects.</>,
              <><strong>Invoice</strong> — Billing document. Set the amount here — this feeds the revenue stats.</>,
              <><strong>Change Order</strong> — When scope changes mid-project. Always document scope changes.</>,
              <><strong>Completion Certificate</strong> — Formal project closure. Generate when project is marked complete.</>,
            ]}
          />
          <SectionHeading>Document Status Flow</SectionHeading>
          <div className="flex items-center gap-1 flex-wrap">
            {["draft", "sent", "signed", "paid"].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-1">
                <StatusBadge
                  label={s}
                  color={s === "paid" ? "#22C55E" : s === "signed" ? "#10B981" : s === "sent" ? "#3B82F6" : "#6B7280"}
                />
                {i < arr.length - 1 && <ArrowRight size={10} className="text-gray-400" />}
              </span>
            ))}
          </div>
          <InfoBox title="Revenue Tracking">
            Only documents with status "paid" count toward the revenue figure on the Dashboard. Always mark
            invoices as paid promptly after receiving payment.
          </InfoBox>
        </div>
      ),
    },
    {
      icon: <ClipboardList size={16} />,
      title: "Recaps — Session Documentation",
      description: "Generate recaps for every milestone, session, and project",
      details: (
        <div className="space-y-3 mt-3">
          <p>Recaps are the documentation layer of the BECS workflow. They create a written record of every significant interaction and deliverable.</p>
          <SectionHeading>Recap Types & When to Create Them</SectionHeading>
          <BulletList
            items={[
              <><strong>Intake Recap</strong> — After the initial intake form submission or discovery call</>,
              <><strong>Onboarding Recap</strong> — After the first formal onboarding session with the new client</>,
              <><strong>Discovery Recap</strong> — After the discovery phase is complete</>,
              <><strong>Milestone Recap</strong> — At each major project milestone</>,
              <><strong>Project Recap</strong> — Summary of overall project scope and objectives</>,
              <><strong>Completion Recap</strong> — Formal wrap-up of the entire engagement</>,
              <><strong>Admin Snapshot</strong> — Internal-only administrative notes (not for client viewing)</>,
            ]}
          />
          <TipBox>
            Create a recap within 24 hours of any significant client interaction. The more detailed the recap,
            the more context you have when the client returns for a follow-up engagement.
          </TipBox>
        </div>
      ),
    },
    {
      icon: <Zap size={16} />,
      title: "Automation Log — System Event Timeline",
      description: "Read-only timeline of all automated system events",
      details: (
        <div className="space-y-3 mt-3">
          <p>The Automation Log is a read-only audit trail of everything the system does automatically. You cannot edit or delete entries.</p>
          <SectionHeading>What Gets Logged</SectionHeading>
          <BulletList
            items={[
              "New lead captures from website intake forms (FormSubmit)",
              "Jotform submission syncs",
              "Lead status changes and updates",
              "Client activations and onboarding events",
              "Email scanner runs and results",
            ]}
          />
          <SectionHeading>Event Statuses</SectionHeading>
          <div className="flex flex-wrap gap-1">
            {[
              { s: "success", c: "#22C55E" },
              { s: "failed", c: "#EF4444" },
              { s: "pending", c: "#F59E0B" },
            ].map(({ s, c }) => <StatusBadge key={s} label={s} color={c} />)}
          </div>
          <p className="text-sm text-gray-700 mt-2">Events are grouped by date and sorted newest-first. Each event shows the event type, description, entity context, and status.</p>
          <InfoBox title="Monitoring Failed Events">
            If you see events with status "failed", it means an automated action didn't complete. The most
            common cause is an intake form submission with missing required fields. Check the description for
            details and manually create the lead if needed.
          </InfoBox>
        </div>
      ),
    },
  ];

  return (
    <div>
      <p className="text-sm text-gray-700 mb-4">
        Every page in the sidebar has a specific purpose in the P.E.S. workflow. Click any page below to see
        exactly what it does and how to use it effectively.
      </p>
      {pages.map((page) => (
        <PageGuideCard
          key={page.title}
          icon={page.icon}
          title={page.title}
          description={page.description}
          details={page.details}
        />
      ))}
    </div>
  );
}

function Module5Content() {
  return (
    <div>
      <SectionHeading>User Roles & Permissions</SectionHeading>
      <div className="space-y-2 mb-4">
        {[
          {
            role: "super_admin",
            color: "#7C3AED",
            desc: "Full unrestricted access to all entities, all data, and all admin functions. Can manage users, view all automation logs, and override any record.",
          },
          {
            role: "admin",
            color: DARK_BLUE,
            desc: "Full access to all entities and all features. Can create, edit, and delete any record across all entities.",
          },
          {
            role: "staff",
            color: "#0891B2",
            desc: "Access limited to assigned entities only. Can view and create most records but may have restrictions on deletion and sensitive data.",
          },
          {
            role: "coach",
            color: "#059669",
            desc: "Focused access to client-facing features in assigned entities. Typically used for contracted team members working on specific client projects.",
          },
          {
            role: "viewer",
            color: "#D97706",
            desc: "Read-only access to assigned entities. Can view all records but cannot create, edit, or delete anything.",
          },
        ].map((r) => (
          <div
            key={r.role}
            className="flex gap-3 rounded-lg p-3"
            style={{ background: `${r.color}08`, borderLeft: `3px solid ${r.color}` }}
          >
            <div>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mb-1"
                style={{ background: `${r.color}20`, color: r.color }}
              >
                {r.role}
              </span>
              <p className="text-sm text-gray-700">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <SectionHeading>Data Isolation (Row Level Security)</SectionHeading>
      <p className="text-sm text-gray-700 mb-2">
        All data is isolated per entity at the Supabase database level using Row Level Security (RLS) policies.
        This means:
      </p>
      <BulletList
        items={[
          "You can only see data for the entity you're currently in — no cross-entity data leakage",
          "Entity switching is enforced at the API level, not just the UI level",
          "Even if someone knew the database structure, RLS prevents unauthorized access",
          "All queries automatically filter by entity_id — it's not something that can be bypassed in the UI",
        ]}
      />

      <SectionHeading>Automation — How It Works</SectionHeading>
      <div className="rounded-lg p-4 mt-2 mb-4" style={{ background: "#F8FAFC", border: "1px solid #E5E7EB" }}>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
              style={{ background: `${GREEN}30` }}
            >
              <Globe size={14} style={{ color: DARK_BLUE }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: DARK_BLUE }}>Website Intake Forms (FormSubmit)</p>
              <p className="text-xs text-gray-600 mt-0.5">
                When someone submits the intake form on the website, FormSubmit sends the data to the BECS email.
                The email scanner runs every hour, detects new intake submissions, parses the fields, and
                automatically creates a lead record in the correct entity.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
              style={{ background: `${GREEN}30` }}
            >
              <ClipboardList size={14} style={{ color: DARK_BLUE }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: DARK_BLUE }}>Jotform Submissions</p>
              <p className="text-xs text-gray-600 mt-0.5">
                Jotform submissions are automatically synced to the BECS OS portal. Submissions are matched
                to the correct entity and appear as leads with all available fields populated.
              </p>
            </div>
          </div>
        </div>
      </div>

      <SectionHeading>Maintaining Data Quality</SectionHeading>
      <BulletList
        items={[
          "Always update lead statuses as they move through the pipeline — stale 'new' leads skew dashboard stats",
          "Mark invoices as 'paid' promptly — unpaid invoices undercount your revenue",
          "Update project progress percentages regularly — 0% on active projects looks wrong",
          "Mark meetings as 'completed' after they happen — scheduled past-date meetings inflate the meeting stat",
          "Use the Automation Log to spot any failed captures and fix them manually",
        ]}
      />
      <TipBox>
        Set aside 15 minutes every Friday to do a data hygiene sweep: review stale leads, update project
        progress, mark completed meetings, and check the Automation Log for any failures.
      </TipBox>
    </div>
  );
}

// ─── Client Guide Content ──────────────────────────────────────────────────

function ClientGuideContent() {
  const sections = [
    {
      icon: <Star size={16} />,
      title: "Welcome to Your Client Portal",
      color: "#A2D652",
      content: (
        <div className="space-y-3 mt-3">
          <p className="text-sm text-gray-700">
            You have access to the BECS OS client portal — a dedicated space to view your project status,
            meeting schedule, documents, and communication history with your BECS consultant.
          </p>
          <p className="text-sm text-gray-700">
            Your portal is personalized to you. Everything you see is specific to your engagement with BECS —
            no other client's information is visible to you.
          </p>
          <InfoBox title="Your Login">
            Log in at <strong>thebecs.netlify.app</strong> using the email address and password provided by
            your BECS consultant. Contact your consultant if you need your credentials reset.
          </InfoBox>
        </div>
      ),
    },
    {
      icon: <FolderKanban size={16} />,
      title: "Viewing Your Project Status",
      color: "#3B82F6",
      content: (
        <div className="space-y-3 mt-3">
          <p className="text-sm text-gray-700">
            Your active projects are visible on the Projects page. Each project shows:
          </p>
          <BulletList
            items={[
              <><strong>Progress bar</strong> — How far along the project is (0-100%)</>,
              <><strong>Service type</strong> — What type of engagement this is (e.g., Foundation Builder, Retainer)</>,
              <><strong>Timeline</strong> — Start date and projected end date</>,
              <><strong>Status</strong> — Whether the project is active, paused, or completed</>,
            ]}
          />
          <TipBox>
            If you have questions about your project's progress, reach out to your consultant directly. The
            progress percentage is updated by your BECS team as work is completed.
          </TipBox>
        </div>
      ),
    },
    {
      icon: <CalendarDays size={16} />,
      title: "Viewing Your Meeting Schedule",
      color: "#8B5CF6",
      content: (
        <div className="space-y-3 mt-3">
          <p className="text-sm text-gray-700">
            The Meetings page shows all scheduled and past meetings for your engagement.
          </p>
          <BulletList
            items={[
              "Upcoming meetings appear at the top, sorted by date",
              "Each meeting shows the type (discovery, check-in, etc.), date, time, and duration",
              "Completed meetings remain visible for your reference",
              "Meeting notes added by your consultant are visible after the meeting",
            ]}
          />
          <InfoBox title="Scheduling New Meetings">
            To schedule a new meeting, contact your BECS consultant directly via email or phone. Your
            consultant will create the meeting in the portal and you'll see it appear here.
          </InfoBox>
        </div>
      ),
    },
    {
      icon: <Scale size={16} />,
      title: "Accessing Your Documents",
      color: "#10B981",
      content: (
        <div className="space-y-3 mt-3">
          <p className="text-sm text-gray-700">
            The Legal & Docs page gives you access to all documents associated with your engagement.
          </p>
          <BulletList
            items={[
              <><strong>NDA</strong> — Non-disclosure agreement (if applicable)</>,
              <><strong>Agreement</strong> — Your master service agreement</>,
              <><strong>SOW</strong> — Statement of Work detailing project scope</>,
              <><strong>Invoices</strong> — Billing records for your engagement</>,
              <><strong>Completion Certificate</strong> — Generated when your project is complete</>,
            ]}
          />
          <TipBox>
            Keep copies of your signed agreements and invoices for your records. Your BECS consultant can
            resend any document if needed.
          </TipBox>
        </div>
      ),
    },
    {
      icon: <ClipboardList size={16} />,
      title: "Viewing Your Recaps",
      color: "#F97316",
      content: (
        <div className="space-y-3 mt-3">
          <p className="text-sm text-gray-700">
            After each significant session or milestone, your BECS consultant creates a recap documenting
            what was covered, decisions made, and next steps.
          </p>
          <BulletList
            items={[
              "Recaps are linked to your client record and visible on the Recaps page",
              "Each recap has a type (intake, onboarding, milestone, completion, etc.) and a detailed summary",
              "Use recaps as a reference point to track progress and remember key decisions",
            ]}
          />
        </div>
      ),
    },
    {
      icon: <PhoneCall size={16} />,
      title: "Contacting Your Consultant",
      color: DARK_BLUE,
      content: (
        <div className="space-y-3 mt-3">
          <p className="text-sm text-gray-700">
            Your BECS consultant is your primary point of contact for all questions about your engagement.
          </p>
          <BulletList
            items={[
              "Email your consultant directly using the email address they provided at onboarding",
              "For urgent matters, use the phone number provided in your onboarding documents",
              "Response times vary — allow 1-2 business days for non-urgent questions",
              "For project scope changes or additional service requests, contact your consultant to initiate a change order",
            ]}
          />
          <InfoBox title="Portal Issues">
            If you experience technical issues with the portal (can't log in, missing data, etc.), email your
            BECS consultant and include a description of the issue and what page you were on.
          </InfoBox>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <PageGuideCard
          key={section.title}
          icon={section.icon}
          title={section.title}
          description=""
          details={section.content}
        />
      ))}
    </div>
  );
}

// ─── Module Accordion ──────────────────────────────────────────────────────

function ModuleAccordion({
  module,
  isCompleted,
  onToggleComplete,
}: {
  module: Module;
  isCompleted: boolean;
  onToggleComplete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card
      className="overflow-hidden transition-all duration-200"
      style={{
        borderColor: isCompleted ? `${GREEN}60` : "#E5E7EB",
        boxShadow: open ? "0 4px 20px rgba(38,41,106,0.08)" : undefined,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left"
        data-testid={`module-toggle-${module.id}`}
      >
        <CardHeader className="py-4 px-5">
          <div className="flex items-center gap-3">
            {/* Number badge */}
            <span
              className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold shrink-0"
              style={{
                background: isCompleted ? GREEN : `${DARK_BLUE}15`,
                color: isCompleted ? DARK_BLUE : DARK_BLUE,
              }}
            >
              {isCompleted ? <CheckCheck size={16} /> : module.number}
            </span>

            {/* Icon */}
            <span
              className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
              style={{ background: isCompleted ? `${GREEN}30` : "#F8FAFC" }}
            >
              <span style={{ color: isCompleted ? DARK_BLUE : GRAY_BLUE }}>{module.icon}</span>
            </span>

            {/* Title area */}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold" style={{ color: DARK_BLUE }}>
                {module.title}
              </CardTitle>
              <p className="text-xs mt-0.5" style={{ color: GRAY_BLUE }}>
                ~{module.estimatedMinutes} min read
              </p>
            </div>

            {/* Completed badge */}
            {isCompleted && (
              <Badge
                className="hidden sm:inline-flex text-xs"
                style={{ background: `${GREEN}30`, color: DARK_BLUE, border: "none" }}
              >
                Completed
              </Badge>
            )}

            {/* Chevron */}
            {open ? (
              <ChevronUp size={16} className="shrink-0" style={{ color: GRAY_BLUE }} />
            ) : (
              <ChevronDown size={16} className="shrink-0" style={{ color: GRAY_BLUE }} />
            )}
          </div>
        </CardHeader>
      </button>

      {open && (
        <CardContent className="px-5 pt-0 pb-5 border-t" style={{ borderColor: "#F3F4F6" }}>
          <div className="pt-4">{module.content}</div>
          <div className="mt-6 pt-4 border-t flex items-center justify-between" style={{ borderColor: "#F3F4F6" }}>
            <span className="text-xs text-gray-400">
              {isCompleted ? "Marked as complete" : "Mark this module as complete when you're done"}
            </span>
            <Button
              size="sm"
              onClick={onToggleComplete}
              data-testid={`module-complete-${module.id}`}
              style={
                isCompleted
                  ? { background: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB" }
                  : { background: DARK_BLUE, color: "white" }
              }
              className="text-xs font-medium"
            >
              {isCompleted ? (
                <>
                  <Circle size={12} className="mr-1.5" />
                  Undo
                </>
              ) : (
                <>
                  <CheckCircle2 size={12} className="mr-1.5" />
                  Mark Complete
                </>
              )}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main Training Page ────────────────────────────────────────────────────

export default function TrainingPage() {
  const { becsUser } = useAuth();

  const isAdmin =
    becsUser?.role === "super_admin" || becsUser?.role === "admin";

  const [activeTab, setActiveTab] = useState<"admin" | "client">(
    isAdmin ? "admin" : "client"
  );

  // Progress tracking — use a simple in-memory map (localStorage is blocked in sandboxed iframe)
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const adminModules: Module[] = [
    {
      id: "getting-started",
      number: 1,
      title: "Getting Started",
      icon: <BookOpen size={16} />,
      estimatedMinutes: 5,
      content: <Module1Content />,
    },
    {
      id: "entity-management",
      number: 2,
      title: "Entity Management",
      icon: <Building2 size={16} />,
      estimatedMinutes: 4,
      content: <Module2Content />,
    },
    {
      id: "pes-lifecycle",
      number: 3,
      title: "P.E.S. Lifecycle Workflow",
      icon: <GitBranch size={16} />,
      estimatedMinutes: 15,
      content: <Module3Content />,
    },
    {
      id: "page-guide",
      number: 4,
      title: "Page-by-Page Guide",
      icon: <LayoutDashboard size={16} />,
      estimatedMinutes: 20,
      content: <Module4Content />,
    },
    {
      id: "admin-operations",
      number: 5,
      title: "Admin Operations & Data Management",
      icon: <Shield size={16} />,
      estimatedMinutes: 8,
      content: <Module5Content />,
    },
  ];

  const toggleComplete = (id: string) => {
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = adminModules.filter((m) => completed[m.id]).length;
  const progressPct = Math.round((completedCount / adminModules.length) * 100);

  const totalMinutes = adminModules.reduce((sum, m) => sum + m.estimatedMinutes, 0);

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      {/* ── Page Header ── */}
      <div
        className="px-6 pt-8 pb-6"
        style={{
          background: `linear-gradient(135deg, ${DARK_BLUE} 0%, #1a1d50 100%)`,
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: `${GREEN}25` }}
            >
              <GraduationCap size={20} style={{ color: GREEN }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">BECS OS Training Center</h1>
              <p className="text-sm" style={{ color: `${GRAY_BLUE}` }}>
                Your complete guide to the portal
              </p>
            </div>
          </div>

          {becsUser && (
            <p className="text-sm mb-5" style={{ color: "#A1B4C4" }}>
              Welcome,{" "}
              <span className="font-semibold text-white">{becsUser.displayName || becsUser.email}</span>
              {becsUser.role && (
                <>
                  {" "}·{" "}
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: `${GREEN}30`, color: GREEN }}
                  >
                    {becsUser.role}
                  </span>
                </>
              )}
            </p>
          )}

          {/* ── Tab Navigation ── */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.08)", width: "fit-content" }}>
            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin")}
                data-testid="tab-admin-guide"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={
                  activeTab === "admin"
                    ? { background: GREEN, color: DARK_BLUE }
                    : { color: "rgba(255,255,255,0.7)" }
                }
              >
                Admin Guide
              </button>
            )}
            <button
              onClick={() => setActiveTab("client")}
              data-testid="tab-client-guide"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={
                activeTab === "client"
                  ? { background: GREEN, color: DARK_BLUE }
                  : { color: "rgba(255,255,255,0.7)" }
              }
            >
              Client Guide
            </button>
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Admin Guide Tab ── */}
        {activeTab === "admin" && isAdmin && (
          <div>
            {/* Progress Card */}
            <Card className="mb-6" style={{ borderColor: "#E5E7EB" }}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: DARK_BLUE }}>
                      Your Progress
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {completedCount} of {adminModules.length} modules completed · ~{totalMinutes} min total
                    </p>
                  </div>
                  <span
                    className="text-lg font-bold"
                    style={{ color: progressPct === 100 ? GREEN : DARK_BLUE }}
                  >
                    {progressPct}%
                  </span>
                </div>
                <Progress
                  value={progressPct}
                  className="h-2"
                  style={
                    {
                      "--progress-background": GREEN,
                    } as React.CSSProperties
                  }
                />
                {progressPct === 100 && (
                  <div
                    className="flex items-center gap-2 mt-3 p-2.5 rounded-lg"
                    style={{ background: `${GREEN}20` }}
                  >
                    <Trophy size={14} style={{ color: DARK_BLUE }} />
                    <p className="text-xs font-semibold" style={{ color: DARK_BLUE }}>
                      All modules complete — you're ready to work the P.E.S. Lifecycle!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Reference */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Entities", value: "3", icon: <Building2 size={14} />, color: "#7C3AED" },
                { label: "P.E.S. Steps", value: "8", icon: <GitBranch size={14} />, color: "#F97316" },
                { label: "Page Guides", value: "9", icon: <LayoutDashboard size={14} />, color: DARK_BLUE },
                { label: "Doc Types", value: "6", icon: <Scale size={14} />, color: "#10B981" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg p-3 text-center"
                  style={{ background: `${stat.color}08`, border: `1px solid ${stat.color}20` }}
                >
                  <span style={{ color: stat.color }} className="flex justify-center mb-1">{stat.icon}</span>
                  <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Module Accordions */}
            <div className="space-y-3">
              {adminModules.map((module) => (
                <ModuleAccordion
                  key={module.id}
                  module={module}
                  isCompleted={!!completed[module.id]}
                  onToggleComplete={() => toggleComplete(module.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Client Guide Tab ── */}
        {activeTab === "client" && (
          <div>
            {/* Client guide header card */}
            <Card className="mb-6 overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
              <div className="p-5" style={{ background: `linear-gradient(135deg, ${LIGHT_GREEN} 0%, #f0fdf4 100%)` }}>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-xl"
                    style={{ background: `${GREEN}40` }}
                  >
                    <Star size={16} style={{ color: DARK_BLUE }} />
                  </div>
                  <div>
                    <h2 className="font-bold text-base" style={{ color: DARK_BLUE }}>
                      Client Portal Guide
                    </h2>
                    <p className="text-xs" style={{ color: GRAY_BLUE }}>
                      Everything you need to navigate your BECS client portal
                    </p>
                  </div>
                </div>
                <p className="text-sm mt-3" style={{ color: DARK_BLUE, maxWidth: "none" }}>
                  Your BECS OS portal gives you a clear window into your consulting engagement. Track your
                  project, review meeting notes, access your documents, and stay aligned with your consultant
                  — all in one place.
                </p>
              </div>
            </Card>

            <ClientGuideContent />

            {/* Footer CTA */}
            <Card
              className="mt-6"
              style={{ background: DARK_BLUE, borderColor: DARK_BLUE }}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 mt-0.5"
                    style={{ background: `${GREEN}30` }}
                  >
                    <Lock size={16} style={{ color: GREEN }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white mb-1">Your Data is Private</p>
                    <p className="text-xs" style={{ color: GRAY_BLUE, maxWidth: "none" }}>
                      Your portal access is restricted to your own engagement data only. You cannot see any
                      other client's information, and BECS maintains strict data isolation across all accounts.
                      All data is encrypted and stored securely.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            BECS OS Training Center · Questions? Contact your BECS administrator
          </p>
        </div>
      </div>
    </div>
  );
}
