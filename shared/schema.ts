import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── USERS (Admin only for now) ───────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("admin"), // admin | client
  passwordHash: text("password_hash"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// ─── LEADS ────────────────────────────────────────────────────────────────────
export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: text("lead_id").notNull().unique(), // BECS-L-001
  name: text("name").notNull(),
  businessName: text("business_name"),
  email: text("email").notNull(),
  phone: text("phone"),
  businessStage: text("business_stage"), // startup | growing | established
  serviceInterest: text("service_interest"), // reality_check | foundation | launch | retainer
  goals: text("goals"),
  painPoints: text("pain_points"),
  timeline: text("timeline"),
  budgetComfort: text("budget_comfort"), // low | mid | high
  referralSource: text("referral_source"), // website | linkedin | referral | speaking | direct
  status: text("status").notNull().default("new"), // new | reviewing | discovery | assessment | proposal | nurture | not_fit
  qualificationNotes: text("qualification_notes"),
  recommendedPath: text("recommended_path"), // path_a | path_b | path_c | path_d
  nextStep: text("next_step"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

// ─── CLIENTS ──────────────────────────────────────────────────────────────────
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: text("client_id").notNull().unique(), // BECS-C-001
  leadId: integer("lead_id"), // converted from lead
  name: text("name").notNull(),
  businessName: text("business_name"),
  email: text("email").notNull(),
  phone: text("phone"),
  portalAccessActive: integer("portal_access_active").notNull().default(0),
  status: text("status").notNull().default("active"), // active | paused | complete | archived
  onboardingComplete: integer("onboarding_complete").notNull().default(0),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// ─── PROJECTS ─────────────────────────────────────────────────────────────────
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: text("project_id").notNull().unique(), // BECS-P-001
  clientId: integer("client_id").notNull(),
  serviceType: text("service_type").notNull(), // reality_check | foundation_builder | business_launch | retainer | add_on
  title: text("title").notNull(),
  status: text("status").notNull().default("pending"), // pending | active | on_hold | complete | archived
  currentPhase: text("current_phase"),
  totalPhases: integer("total_phases").default(0),
  progressPercent: integer("progress_percent").default(0),
  startDate: text("start_date"),
  targetEndDate: text("target_end_date"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

// ─── MILESTONES ───────────────────────────────────────────────────────────────
export const milestones = sqliteTable("milestones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending | in_progress | complete | locked | reopened
  dueDate: text("due_date"),
  completedAt: text("completed_at"),
  sortOrder: integer("sort_order").default(0),
  clientActionRequired: integer("client_action_required").default(0),
  adminNotes: text("admin_notes"),
});

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
export const onboardingItems = sqliteTable("onboarding_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull(),
  item: text("item").notNull(),
  status: text("status").notNull().default("pending"), // pending | complete | skipped
  dueDate: text("due_date"),
  completedAt: text("completed_at"),
  notes: text("notes"),
  sortOrder: integer("sort_order").default(0),
});

// ─── MEETINGS ─────────────────────────────────────────────────────────────────
export const meetings = sqliteTable("meetings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id"),
  leadId: integer("lead_id"),
  projectId: integer("project_id"),
  type: text("type").notNull(), // discovery | kickoff | strategy | check_in | milestone_review | final | follow_up
  title: text("title").notNull(),
  scheduledAt: text("scheduled_at"),
  duration: integer("duration"), // minutes
  status: text("status").notNull().default("scheduled"), // scheduled | completed | cancelled | rescheduled
  notes: text("notes"),
  actionItems: text("action_items"), // JSON array
  recap: text("recap"),
  calendarEventId: text("calendar_event_id"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// ─── PROPOSALS ────────────────────────────────────────────────────────────────
export const proposals = sqliteTable("proposals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  proposalId: text("proposal_id").notNull().unique(), // BECS-PR-001
  leadId: integer("lead_id"),
  clientId: integer("client_id"),
  serviceType: text("service_type").notNull(),
  title: text("title").notNull(),
  scope: text("scope"),
  price: real("price"),
  timeline: text("timeline"),
  deliverables: text("deliverables"), // JSON array
  includedMeetings: text("included_meetings"),
  ndaRequired: integer("nda_required").default(0),
  status: text("status").notNull().default("draft"), // draft | sent | viewed | accepted | declined | expired
  sentAt: text("sent_at"),
  acceptedAt: text("accepted_at"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// ─── LEGAL DOCUMENTS ──────────────────────────────────────────────────────────
export const legalDocs = sqliteTable("legal_docs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  docId: text("doc_id").notNull().unique(),
  clientId: integer("client_id"),
  leadId: integer("lead_id"),
  projectId: integer("project_id"),
  type: text("type").notNull(), // nda | agreement | sow | invoice | change_order | completion_cert
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"), // draft | sent | signed | paid | complete | archived
  signedAt: text("signed_at"),
  amount: real("amount"),
  paidAt: text("paid_at"),
  squarePaymentId: text("square_payment_id"),
  notes: text("notes"),
  fileUrl: text("file_url"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// ─── RECAPS / SUMMARIES ───────────────────────────────────────────────────────
export const recaps = sqliteTable("recaps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id"),
  leadId: integer("lead_id"),
  projectId: integer("project_id"),
  type: text("type").notNull(), // intake | onboarding | discovery | milestone | project | completion | admin_snapshot
  title: text("title").notNull(),
  content: text("content").notNull(),
  generatedAt: text("generated_at").notNull().default(new Date().toISOString()),
  source: text("source"), // form | meeting | milestone | manual
});

// ─── ADD-ONS ──────────────────────────────────────────────────────────────────
export const addOns = sqliteTable("add_ons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull(),
  projectId: integer("project_id"),
  type: text("type").notNull(), // strategy_intensive | implementation | brand_clarity | automation | content | launch | reporting | retainer | advisory
  title: text("title").notNull(),
  description: text("description"),
  price: real("price"),
  status: text("status").notNull().default("recommended"), // recommended | requested | active | complete | declined
  visible: integer("visible").default(1),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// ─── AUTOMATION EVENTS LOG ────────────────────────────────────────────────────
export const automationEvents = sqliteTable("automation_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  entityType: text("entity_type"), // lead | client | project | meeting | doc
  entityId: integer("entity_id"),
  description: text("description").notNull(),
  status: text("status").notNull().default("success"), // success | failed | pending
  triggeredAt: text("triggered_at").notNull().default(new Date().toISOString()),
});

// ─── INSERT SCHEMAS ───────────────────────────────────────────────────────────
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMilestoneSchema = createInsertSchema(milestones).omit({ id: true });
export const insertMeetingSchema = createInsertSchema(meetings).omit({ id: true, createdAt: true });
export const insertProposalSchema = createInsertSchema(proposals).omit({ id: true, createdAt: true });
export const insertLegalDocSchema = createInsertSchema(legalDocs).omit({ id: true, createdAt: true });
export const insertRecapSchema = createInsertSchema(recaps).omit({ id: true, generatedAt: true });
export const insertAddOnSchema = createInsertSchema(addOns).omit({ id: true, createdAt: true });
export const insertOnboardingItemSchema = createInsertSchema(onboardingItems).omit({ id: true });

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;

export type LegalDoc = typeof legalDocs.$inferSelect;
export type InsertLegalDoc = z.infer<typeof insertLegalDocSchema>;

export type Recap = typeof recaps.$inferSelect;
export type InsertRecap = z.infer<typeof insertRecapSchema>;

export type AddOn = typeof addOns.$inferSelect;
export type InsertAddOn = z.infer<typeof insertAddOnSchema>;

export type OnboardingItem = typeof onboardingItems.$inferSelect;
export type InsertOnboardingItem = z.infer<typeof insertOnboardingItemSchema>;

export type AutomationEvent = typeof automationEvents.$inferSelect;
