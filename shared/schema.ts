import { z } from "zod";

// ─── TYPES (matching Supabase/PostgreSQL schema) ──────────────────────────────

export interface Lead {
  id: number;
  leadId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: number;
  clientId: string;
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
  item: string;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  notes: string | null;
  sortOrder: number;
}

export interface Meeting {
  id: number;
  clientId: number | null;
  leadId: number | null;
  projectId: number | null;
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
  notes: string | null;
  createdAt: string;
}

export interface LegalDoc {
  id: number;
  docId: string;
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
  entityId: number | null;
  description: string;
  status: string;
  triggeredAt: string;
}

// ─── INSERT SCHEMAS (Zod) ─────────────────────────────────────────────────────

export const insertLeadSchema = z.object({
  leadId: z.string().optional(),
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
  type: z.string(),
  title: z.string().min(1),
  content: z.string().min(1),
  source: z.string().optional().nullable(),
});

export const insertAddOnSchema = z.object({
  clientId: z.number(),
  projectId: z.number().optional().nullable(),
  type: z.string(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  status: z.string().default("recommended"),
  visible: z.boolean().default(true),
});

export const insertOnboardingItemSchema = z.object({
  clientId: z.number(),
  item: z.string().min(1),
  status: z.string().default("pending"),
  dueDate: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  sortOrder: z.number().default(0),
});

// ─── INSERT TYPES ─────────────────────────────────────────────────────────────
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
