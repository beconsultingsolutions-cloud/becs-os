import { z } from "zod";

// ─── ENTITY ENUM ─────────────────────────────────────────────────────────────
export const ENTITIES = ["becs", "lane_ellis", "me_and_them"] as const;
export type EntityId = (typeof ENTITIES)[number];

export const ENTITY_LABELS: Record<EntityId, string> = {
  becs: "BECS",
  lane_ellis: "Lane Ellis",
  me_and_them: "ME & THEM",
};

// ─── SERVICE TYPES ──────────────────────────────────────────────────────────
export const SERVICE_TYPES = [
  "reality_check",
  "foundation_builder",
  "business_launch",
  "strategy_ops_session",
  "accelerator",
  "brand_identity",
  "gtm_launch",
  "compliance_coaching",
  "retainer",
  "add_on",
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_LABELS: Record<ServiceType, string> = {
  reality_check: "P.E.S. Reality Check",
  foundation_builder: "Foundation Builder",
  business_launch: "P.E.S. Business Launch",
  strategy_ops_session: "Strategy & Operations Session",
  accelerator: "B.E. Accelerator Program",
  brand_identity: "Brand Identity & Positioning",
  gtm_launch: "Go-To-Market Launch Strategy",
  compliance_coaching: "Compliance Coaching",
  retainer: "Retainer",
  add_on: "Add-On",
};

// ─── ROLE ENUM ───────────────────────────────────────────────────────────────
export const ROLES = ["super_admin", "admin", "entity_manager", "contractor", "client_user"] as const;
export type UserRole = (typeof ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  entity_manager: "Entity Manager",
  contractor: "Contractor",
  client_user: "Client User",
};

// ─── 5C ONBOARDING PHASES ────────────────────────────────────────────────────
export const ONBOARDING_PHASES = ["compliance", "clarity", "culture", "connection", "checkback"] as const;
export type OnboardingPhase = (typeof ONBOARDING_PHASES)[number];

export const PHASE_LABELS: Record<OnboardingPhase, string> = {
  compliance: "Compliance",
  clarity: "Clarity",
  culture: "Culture",
  connection: "Connection",
  checkback: "Checkback",
};

// ─── OPPORTUNITY STAGES ──────────────────────────────────────────────────────
export const OPP_STAGES = ["inquiry", "discovery", "proposal", "negotiation", "won", "lost", "on_hold"] as const;
export type OppStage = (typeof OPP_STAGES)[number];

// ─── TYPES (matching Supabase/PostgreSQL schema) ──────────────────────────────

export interface User {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  entityIds: string[];
  googleId: string | null;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: number;
  contactId: string;
  entityId: EntityId;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  businessName: string | null;
  title: string | null;
  type: string;
  source: string | null;
  tags: string[] | null;
  notes: string | null;
  userId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: number;
  opportunityId: string;
  entityId: EntityId;
  contactId: number | null;
  leadId: number | null;
  title: string;
  serviceType: string | null;
  stage: OppStage;
  amount: number | null;
  probability: number;
  expectedCloseDate: string | null;
  assignedTo: number | null;
  notes: string | null;
  lostReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: number;
  leadId: string;
  entityId: EntityId;
  name: string;
  businessName: string | null;
  email: string;
  phone: string | null;
  businessStage: string | null;
  serviceInterest: string | null;
  goals: string | null;
  painPoints: string | null;
  timeline: string | null;
  budgetComfort: string | null;
  referralSource: string | null;
  status: string;
  qualificationNotes: string | null;
  recommendedPath: string | null;
  nextStep: string | null;
  scoreBudget: number;
  scoreAuthority: number;
  scoreNeed: number;
  scoreTimeline: number;
  scoreFit: number;
  leadScore: number;
  mode: string | null;
  createdAt: string;
  updatedAt: string;
  // Prospecting fields
  linkedinUrl?: string | null;
  location?: string | null;
  fitScore?: number | null;
  priority?: string | null;
  website?: string | null;
  industry?: string | null;
  fitReasoning?: string | null;
}

export interface Client {
  id: number;
  clientId: string;
  entityId: EntityId;
  leadId: number | null;
  name: string;
  businessName: string | null;
  email: string;
  phone: string | null;
  portalAccessActive: boolean;
  status: string;
  onboardingComplete: boolean;
  createdAt: string;
}

export interface Project {
  id: number;
  projectId: string;
  entityId: EntityId;
  clientId: number;
  serviceType: string;
  title: string;
  status: string;
  currentPhase: string | null;
  totalPhases: number;
  progressPercent: number;
  startDate: string | null;
  targetEndDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: number;
  projectId: number;
  entityId: EntityId;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  sortOrder: number;
  clientActionRequired: boolean;
  adminNotes: string | null;
}

export interface OnboardingItem {
  id: number;
  clientId: number;
  entityId: EntityId;
  phase: OnboardingPhase;
  item: string;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  notes: string | null;
  sortOrder: number;
  assignedTo: number | null;
  priority: string;
}

export interface Meeting {
  id: number;
  clientId: number | null;
  leadId: number | null;
  projectId: number | null;
  entityId: EntityId;
  type: string;
  title: string;
  scheduledAt: string | null;
  duration: number | null;
  status: string;
  notes: string | null;
  actionItems: string | null;
  recap: string | null;
  calendarEventId: string | null;
  createdAt: string;
}

export interface Proposal {
  id: number;
  proposalId: string;
  entityId: EntityId;
  leadId: number | null;
  clientId: number | null;
  serviceType: string;
  title: string;
  scope: string | null;
  price: number | null;
  timeline: string | null;
  deliverables: string | null;
  includedMeetings: string | null;
  ndaRequired: boolean;
  status: string;
  sentAt: string | null;
  acceptedAt: string | null;
  shareToken: string | null;
  notes: string | null;
  createdAt: string;
}

export interface LegalDoc {
  id: number;
  docId: string;
  entityId: EntityId;
  clientId: number | null;
  leadId: number | null;
  projectId: number | null;
  type: string;
  title: string;
  status: string;
  signedAt: string | null;
  amount: number | null;
  paidAt: string | null;
  squarePaymentId: string | null;
  notes: string | null;
  fileUrl: string | null;
  createdAt: string;
}

export interface Recap {
  id: number;
  clientId: number | null;
  leadId: number | null;
  projectId: number | null;
  entityId: EntityId;
  type: string;
  title: string;
  content: string;
  generatedAt: string;
  source: string | null;
}

export interface AddOn {
  id: number;
  clientId: number;
  projectId: number | null;
  entityId: EntityId;
  type: string;
  title: string;
  description: string | null;
  price: number | null;
  status: string;
  visible: boolean;
  createdAt: string;
}

export interface AutomationEvent {
  id: number;
  type: string;
  entityType: string | null;
  recordId: number | null;
  entityId: EntityId;
  description: string;
  status: string;
  triggeredAt: string;
}

// ─── TASK STATUSES ───────────────────────────────────────────────────────────
export const TASK_STATUSES = ["todo", "in_progress", "review", "blocked", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

// ─── INVOICE STATUSES ────────────────────────────────────────────────────────
export const INVOICE_STATUSES = ["draft", "sent", "viewed", "paid", "partial", "overdue", "cancelled", "refunded"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

// ─── PAYMENT METHODS ─────────────────────────────────────────────────────────
export const PAYMENT_METHODS = ["square", "cash", "check", "wire", "zelle", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// ─── EXPENSE CATEGORIES ──────────────────────────────────────────────────────
export const EXPENSE_CATEGORIES = ["general", "software", "marketing", "travel", "supplies", "contractor", "other"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

// ─── PHASE 2 TYPES ───────────────────────────────────────────────────────────

export interface Task {
  id: number;
  taskId: string;
  entityId: EntityId;
  projectId: number | null;
  clientId: number | null;
  assignedTo: number | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  sortOrder: number;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoachingSession {
  id: number;
  sessionId: string;
  entityId: EntityId;
  clientId: number | null;
  contactId: number | null;
  projectId: number | null;
  coachId: number | null;
  phase: OnboardingPhase;
  sessionType: string;
  title: string;
  scheduledAt: string | null;
  duration: number;
  status: string;
  agenda: string | null;
  notes: string | null;
  actionItems: string | null;
  outcome: string | null;
  nextSessionDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: number;
  invoiceId: string;
  entityId: EntityId;
  clientId: number | null;
  projectId: number | null;
  opportunityId: number | null;
  title: string;
  description: string | null;
  amount: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  dueDate: string | null;
  issuedAt: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: number;
  paymentId: string;
  entityId: EntityId;
  invoiceId: number | null;
  clientId: number | null;
  amount: number;
  method: PaymentMethod;
  squarePaymentId: string | null;
  squareOrderId: string | null;
  status: string;
  paidAt: string | null;
  refundedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Expense {
  id: number;
  expenseId: string;
  entityId: EntityId;
  projectId: number | null;
  clientId: number | null;
  submittedBy: number | null;
  approvedBy: number | null;
  category: ExpenseCategory;
  title: string;
  description: string | null;
  amount: number;
  receiptUrl: string | null;
  status: string;
  expenseDate: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── BE UNIVERSITY (course catalog + enrollments) ───────────────────────────

export interface BeUCourse {
  id: number;
  courseId: string;
  slug: string;
  title: string;
  description: string | null;
  mode: "plan" | "evolve" | "succeed" | null;
  tier: "foundation" | "core" | "advanced" | "retainer" | null;
  priceCents: number;
  durationWeeks: number | null;
  coverImageUrl: string | null;
  externalId: string | null;
  externalUrl: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BeUEnrollment {
  id: number;
  enrollmentId: string;
  clientId: number;
  courseId: number;
  status: "enrolled" | "in_progress" | "completed" | "dropped" | "revoked";
  progressPct: number;
  source: "manual" | "proposal_close" | "be_u_webhook" | "admin_grant";
  proposalId: number | null;
  externalId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  lastActive: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BeUCertificate {
  id: number;
  certificateId: string;
  enrollmentId: number;
  certUrl: string | null;
  certImageUrl: string | null;
  issuedAt: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface BeUWebhookEvent {
  id: number;
  eventId: string;
  direction: "inbound" | "outbound";
  source: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: "received" | "processed" | "failed" | "skipped";
  errorMessage: string | null;
  clientId: number | null;
  enrollmentId: number | null;
  receivedAt: string;
  processedAt: string | null;
}

// ─── INSERT SCHEMAS (Zod) ─────────────────────────────────────────────────────

export const insertUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  avatarUrl: z.string().optional().nullable(),
  role: z.enum(ROLES).default("client_user"),
  entityIds: z.array(z.string()).default(["becs"]),
  googleId: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const insertContactSchema = z.object({
  contactId: z.string().optional(),
  entityId: z.enum(ENTITIES).default("becs"),
  firstName: z.string().min(1),
  lastName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  businessName: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  type: z.string().default("lead"),
  source: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  notes: z.string().optional().nullable(),
  userId: z.number().optional().nullable(),
});

export const insertOpportunitySchema = z.object({
  opportunityId: z.string().optional(),
  entityId: z.enum(ENTITIES).default("becs"),
  contactId: z.number().optional().nullable(),
  leadId: z.number().optional().nullable(),
  title: z.string().min(1),
  serviceType: z.string().optional().nullable(),
  stage: z.enum(OPP_STAGES).default("inquiry"),
  amount: z.number().optional().nullable(),
  probability: z.number().default(0),
  expectedCloseDate: z.string().optional().nullable(),
  assignedTo: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  lostReason: z.string().optional().nullable(),
});

export const insertLeadSchema = z.object({
  leadId: z.string().optional(),
  entityId: z.enum(ENTITIES).default("becs"),
  name: z.string().min(1),
  businessName: z.string().optional().nullable(),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  businessStage: z.string().optional().nullable(),
  serviceInterest: z.string().optional().nullable(),
  goals: z.string().optional().nullable(),
  painPoints: z.string().optional().nullable(),
  timeline: z.string().optional().nullable(),
  budgetComfort: z.string().optional().nullable(),
  referralSource: z.string().optional().nullable(),
  status: z.string().default("new"),
  qualificationNotes: z.string().optional().nullable(),
  recommendedPath: z.string().optional().nullable(),
  nextStep: z.string().optional().nullable(),
});

export const insertClientSchema = z.object({
  clientId: z.string().optional(),
  entityId: z.enum(ENTITIES).default("becs"),
  leadId: z.number().optional().nullable(),
  name: z.string().min(1),
  businessName: z.string().optional().nullable(),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  portalAccessActive: z.boolean().default(false),
  status: z.string().default("active"),
  onboardingComplete: z.boolean().default(false),
});

export const insertProjectSchema = z.object({
  projectId: z.string().optional(),
  entityId: z.enum(ENTITIES).default("becs"),
  clientId: z.number(),
  serviceType: z.string(),
  title: z.string().min(1),
  status: z.string().default("pending"),
  currentPhase: z.string().optional().nullable(),
  totalPhases: z.number().default(0),
  progressPercent: z.number().default(0),
  startDate: z.string().optional().nullable(),
  targetEndDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const insertMilestoneSchema = z.object({
  projectId: z.number(),
  entityId: z.enum(ENTITIES).default("becs"),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  status: z.string().default("pending"),
  dueDate: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
  sortOrder: z.number().default(0),
  clientActionRequired: z.boolean().default(false),
  adminNotes: z.string().optional().nullable(),
});

export const insertMeetingSchema = z.object({
  clientId: z.number().optional().nullable(),
  leadId: z.number().optional().nullable(),
  projectId: z.number().optional().nullable(),
  entityId: z.enum(ENTITIES).default("becs"),
  type: z.string(),
  title: z.string().min(1),
  scheduledAt: z.string().optional().nullable(),
  duration: z.number().optional().nullable(),
  status: z.string().default("scheduled"),
  notes: z.string().optional().nullable(),
  actionItems: z.string().optional().nullable(),
  recap: z.string().optional().nullable(),
  calendarEventId: z.string().optional().nullable(),
});

export const insertProposalSchema = z.object({
  proposalId: z.string().optional(),
  entityId: z.enum(ENTITIES).default("becs"),
  leadId: z.number().optional().nullable(),
  clientId: z.number().optional().nullable(),
  serviceType: z.string(),
  title: z.string().min(1),
  scope: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  timeline: z.string().optional().nullable(),
  deliverables: z.string().optional().nullable(),
  includedMeetings: z.string().optional().nullable(),
  ndaRequired: z.boolean().default(false),
  status: z.string().default("draft"),
  sentAt: z.string().optional().nullable(),
  acceptedAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const insertLegalDocSchema = z.object({
  docId: z.string().optional(),
  entityId: z.enum(ENTITIES).default("becs"),
  clientId: z.number().optional().nullable(),
  leadId: z.number().optional().nullable(),
  projectId: z.number().optional().nullable(),
  type: z.string(),
  title: z.string().min(1),
  status: z.string().default("draft"),
  signedAt: z.string().optional().nullable(),
  amount: z.number().optional().nullable(),
  paidAt: z.string().optional().nullable(),
  squarePaymentId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
});

export const insertRecapSchema = z.object({
  clientId: z.number().optional().nullable(),
  leadId: z.number().optional().nullable(),
  projectId: z.number().optional().nullable(),
  entityId: z.enum(ENTITIES).default("becs"),
  type: z.string(),
  title: z.string().min(1),
  content: z.string().min(1),
  source: z.string().optional().nullable(),
});

export const insertAddOnSchema = z.object({
  clientId: z.number(),
  projectId: z.number().optional().nullable(),
  entityId: z.enum(ENTITIES).default("becs"),
  type: z.string(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  status: z.string().default("recommended"),
  visible: z.boolean().default(true),
});

export const insertOnboardingItemSchema = z.object({
  clientId: z.number(),
  entityId: z.enum(ENTITIES).default("becs"),
  phase: z.enum(ONBOARDING_PHASES).default("compliance"),
  item: z.string().min(1),
  status: z.string().default("pending"),
  dueDate: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  sortOrder: z.number().default(0),
  assignedTo: z.number().optional().nullable(),
  priority: z.string().default("medium"),
});

export const insertTaskSchema = z.object({
  taskId: z.string().optional(),
  entityId: z.enum(ENTITIES).default("becs"),
  projectId: z.number().optional().nullable(),
  clientId: z.number().optional().nullable(),
  assignedTo: z.number().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  status: z.enum(TASK_STATUSES).default("todo"),
  priority: z.string().default("medium"),
  dueDate: z.string().optional().nullable(),
  sortOrder: z.number().default(0),
  tags: z.array(z.string()).optional().nullable(),
});

export const insertCoachingSessionSchema = z.object({
  sessionId: z.string().optional(),
  entityId: z.enum(ENTITIES).default("becs"),
  clientId: z.number().optional().nullable(),
  contactId: z.number().optional().nullable(),
  projectId: z.number().optional().nullable(),
  coachId: z.number().optional().nullable(),
  phase: z.enum(ONBOARDING_PHASES).default("compliance"),
  sessionType: z.string().default("one_on_one"),
  title: z.string().min(1),
  scheduledAt: z.string().optional().nullable(),
  duration: z.number().default(60),
  status: z.string().default("scheduled"),
  agenda: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  actionItems: z.string().optional().nullable(),
  outcome: z.string().optional().nullable(),
  nextSessionDate: z.string().optional().nullable(),
});

export const insertInvoiceSchema = z.object({
  invoiceId: z.string().optional(),
  entityId: z.enum(ENTITIES).default("becs"),
  clientId: z.number().optional().nullable(),
  projectId: z.number().optional().nullable(),
  opportunityId: z.number().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  amount: z.number().min(0),
  tax: z.number().default(0),
  status: z.enum(INVOICE_STATUSES).default("draft"),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const insertPaymentSchema = z.object({
  paymentId: z.string().optional(),
  entityId: z.enum(ENTITIES).default("becs"),
  invoiceId: z.number().optional().nullable(),
  clientId: z.number().optional().nullable(),
  amount: z.number().min(0),
  method: z.enum(PAYMENT_METHODS).default("square"),
  squarePaymentId: z.string().optional().nullable(),
  squareOrderId: z.string().optional().nullable(),
  status: z.string().default("pending"),
  notes: z.string().optional().nullable(),
});

export const insertExpenseSchema = z.object({
  expenseId: z.string().optional(),
  entityId: z.enum(ENTITIES).default("becs"),
  projectId: z.number().optional().nullable(),
  clientId: z.number().optional().nullable(),
  submittedBy: z.number().optional().nullable(),
  category: z.enum(EXPENSE_CATEGORIES).default("general"),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  amount: z.number().min(0),
  receiptUrl: z.string().optional().nullable(),
  status: z.string().default("pending"),
  expenseDate: z.string().optional().nullable(),
});

// ─── INSERT TYPES ─────────────────────────────────────────────────────────────
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type InsertLegalDoc = z.infer<typeof insertLegalDocSchema>;
export type InsertRecap = z.infer<typeof insertRecapSchema>;
export type InsertAddOn = z.infer<typeof insertAddOnSchema>;
export type InsertOnboardingItem = z.infer<typeof insertOnboardingItemSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertCoachingSession = z.infer<typeof insertCoachingSessionSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
