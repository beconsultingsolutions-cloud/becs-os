import { Database } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import BetterSqlite3 from "better-sqlite3";
import * as schema from "@shared/schema";
import { eq, desc, and, like, or } from "drizzle-orm";
import {
  leads, clients, projects, milestones, meetings, proposals,
  legalDocs, recaps, addOns, onboardingItems, automationEvents,
  InsertLead, InsertClient, InsertProject, InsertMilestone, InsertMeeting,
  InsertProposal, InsertLegalDoc, InsertRecap, InsertAddOn, InsertOnboardingItem,
  Lead, Client, Project, Milestone, Meeting, Proposal, LegalDoc, Recap, AddOn, OnboardingItem, AutomationEvent,
} from "@shared/schema";

const sqlite: Database = new BetterSqlite3("becs-os.db");
const db = drizzle(sqlite, { schema });

// ─── MIGRATIONS ───────────────────────────────────────────────────────────────
function migrate() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      business_name TEXT,
      email TEXT NOT NULL,
      phone TEXT,
      business_stage TEXT,
      service_interest TEXT,
      goals TEXT,
      pain_points TEXT,
      timeline TEXT,
      budget_comfort TEXT,
      referral_source TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      qualification_notes TEXT,
      recommended_path TEXT,
      next_step TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL UNIQUE,
      lead_id INTEGER,
      name TEXT NOT NULL,
      business_name TEXT,
      email TEXT NOT NULL,
      phone TEXT,
      portal_access_active INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      onboarding_complete INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL UNIQUE,
      client_id INTEGER NOT NULL,
      service_type TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      current_phase TEXT,
      total_phases INTEGER DEFAULT 0,
      progress_percent INTEGER DEFAULT 0,
      start_date TEXT,
      target_end_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      due_date TEXT,
      completed_at TEXT,
      sort_order INTEGER DEFAULT 0,
      client_action_required INTEGER DEFAULT 0,
      admin_notes TEXT
    );
    CREATE TABLE IF NOT EXISTS onboarding_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      item TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      due_date TEXT,
      completed_at TEXT,
      notes TEXT,
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      lead_id INTEGER,
      project_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      scheduled_at TEXT,
      duration INTEGER,
      status TEXT NOT NULL DEFAULT 'scheduled',
      notes TEXT,
      action_items TEXT,
      recap TEXT,
      calendar_event_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proposal_id TEXT NOT NULL UNIQUE,
      lead_id INTEGER,
      client_id INTEGER,
      service_type TEXT NOT NULL,
      title TEXT NOT NULL,
      scope TEXT,
      price REAL,
      timeline TEXT,
      deliverables TEXT,
      included_meetings TEXT,
      nda_required INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      sent_at TEXT,
      accepted_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS legal_docs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id TEXT NOT NULL UNIQUE,
      client_id INTEGER,
      lead_id INTEGER,
      project_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      signed_at TEXT,
      amount REAL,
      paid_at TEXT,
      square_payment_id TEXT,
      notes TEXT,
      file_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS recaps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      lead_id INTEGER,
      project_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      generated_at TEXT NOT NULL DEFAULT (datetime('now')),
      source TEXT
    );
    CREATE TABLE IF NOT EXISTS add_ons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      project_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price REAL,
      status TEXT NOT NULL DEFAULT 'recommended',
      visible INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS automation_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'success',
      triggered_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  seedData();
}

function genId(prefix: string, count: number) {
  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
}

function seedData() {
  const existingLeads = sqlite.prepare("SELECT COUNT(*) as count FROM leads").get() as { count: number };
  if (existingLeads.count > 0) return;

  // Seed demo leads
  sqlite.prepare(`INSERT INTO leads (lead_id, name, business_name, email, phone, business_stage, service_interest, goals, pain_points, timeline, budget_comfort, referral_source, status, qualification_notes, recommended_path, next_step) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    "BECS-L-001","Maria Delgado","Born Apparel Studio","maria@bornapparelstudio.com","+1 312 555 0101","established","foundation_builder","Build a scalable service model and client experience","Inconsistent revenue, no defined offer structure","90 days","high","referral","proposal","Strong fit — apparel brand with growth goals","path_c","Send proposal"
  );
  sqlite.prepare(`INSERT INTO leads (lead_id, name, business_name, email, phone, business_stage, service_interest, goals, pain_points, timeline, budget_comfort, referral_source, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    "BECS-L-002","James Carter","Carter Co.","james@carterco.com","+1 773 555 0202","startup","reality_check","Understand where to start","No clear business plan or pricing","60 days","mid","linkedin","reviewing"
  );
  sqlite.prepare(`INSERT INTO leads (lead_id, name, business_name, email, phone, business_stage, service_interest, goals, pain_points, timeline, budget_comfort, referral_source, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    "BECS-L-003","Nia Williams","NW Creative","nia@nwcreative.co","+1 847 555 0303","growing","business_launch","Launch a new service line","Lack of structure, no sales process","45 days","high","website","discovery"
  );

  // Seed demo client
  sqlite.prepare(`INSERT INTO clients (client_id, lead_id, name, business_name, email, phone, portal_access_active, status, onboarding_complete) VALUES (?,?,?,?,?,?,?,?,?)`).run(
    "BECS-C-001",1,"Maria Delgado","Born Apparel Studio","maria@bornapparelstudio.com","+1 312 555 0101",1,"active",1
  );

  // Seed demo project
  sqlite.prepare(`INSERT INTO projects (project_id, client_id, service_type, title, status, current_phase, total_phases, progress_percent, start_date, target_end_date) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
    "BECS-P-001",1,"foundation_builder","Foundation Builder — Born Apparel Studio","active","Offer Structure",6,33,"2026-03-15","2026-06-15"
  );

  // Seed milestones
  const milestoneData = [
    [1,"Intake & Business Audit","Complete intake form and initial audit","complete","2026-03-22",0],
    [1,"Offer Structure","Define service offerings and packages","in_progress","2026-04-05",0],
    [1,"Pricing Strategy","Finalize pricing model and tiers","pending","2026-04-19",1],
    [1,"Client Experience Design","Map the client journey end to end","pending","2026-05-03",0],
    [1,"Operations Framework","Build SOPs and workflow documentation","pending","2026-05-17",0],
    [1,"Final Delivery & Review","Present complete foundation package","pending","2026-06-07",0],
  ];
  for (const [i, m] of milestoneData.entries()) {
    sqlite.prepare(`INSERT INTO milestones (project_id, title, description, status, due_date, client_action_required, sort_order) VALUES (?,?,?,?,?,?,?)`).run(m[0], m[1], m[2], m[3], m[4], m[5], i);
  }

  // Seed onboarding items
  const onboardItems = [
    "Complete onboarding intake form","Review portal walkthrough video","Acknowledge roles & responsibilities","Upload business overview document","Confirm primary contact info","Schedule kickoff meeting",
  ];
  for (const [i, item] of onboardItems.entries()) {
    sqlite.prepare(`INSERT INTO onboarding_items (client_id, item, status, sort_order) VALUES (?,?,?,?)`).run(1, item, i < 4 ? "complete" : "pending", i);
  }

  // Seed meetings
  sqlite.prepare(`INSERT INTO meetings (client_id, project_id, type, title, scheduled_at, duration, status, notes, recap) VALUES (?,?,?,?,?,?,?,?,?)`).run(
    1,1,"kickoff","Kickoff — Born Apparel Studio","2026-03-22T14:00:00",60,"completed","Client confirmed goals and priorities. Strong alignment on offer structure focus.","Confirmed 6-phase Foundation Builder. Client will provide brand materials by Mar 29. Next meeting: Offer Structure review on Apr 5."
  );
  sqlite.prepare(`INSERT INTO meetings (client_id, project_id, type, title, scheduled_at, duration, status) VALUES (?,?,?,?,?,?,?)`).run(
    1,1,"check_in","Offer Structure Review","2026-04-05T14:00:00",60,"scheduled"
  );

  // Seed proposal
  sqlite.prepare(`INSERT INTO proposals (proposal_id, lead_id, service_type, title, scope, price, timeline, deliverables, nda_required, status, sent_at, accepted_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    "BECS-PR-001",1,"foundation_builder","Foundation Builder Proposal — Born Apparel Studio","Full business foundation audit, offer structure, pricing strategy, client experience design, and operations framework","2497","90 days",'["Business audit","Offer framework","Pricing structure","Client experience map","Operations guide","Strategy session x3"]',0,"accepted","2026-03-10","2026-03-14"
  );

  // Seed legal docs
  sqlite.prepare(`INSERT INTO legal_docs (doc_id, client_id, project_id, type, title, status, signed_at, amount, paid_at) VALUES (?,?,?,?,?,?,?,?,?)`).run(
    "BECS-DOC-001",1,1,"agreement","Service Agreement — Foundation Builder","signed","2026-03-14",2497,"2026-03-14"
  );
  sqlite.prepare(`INSERT INTO legal_docs (doc_id, client_id, project_id, type, title, status, amount) VALUES (?,?,?,?,?,?,?)`).run(
    "BECS-DOC-002",1,1,"invoice","Invoice #001 — Foundation Builder","paid",2497
  );

  // Seed recap
  sqlite.prepare(`INSERT INTO recaps (client_id, project_id, type, title, content, source) VALUES (?,?,?,?,?,?)`).run(
    1,1,"milestone","Kickoff Recap — Born Apparel Studio",`**Meeting:** Kickoff — March 22, 2026\n\n**Goals Confirmed:**\n- Build a scalable service model for Born Apparel Studio\n- Create clear offer tiers for clients\n- Establish pricing structure\n\n**Priorities:**\n1. Offer structure (most urgent)\n2. Pricing clarity\n3. Client journey mapping\n\n**Deliverables:**\n- Brand materials due March 29\n- Phase 2 review scheduled April 5\n\n**Next Step:** Offer Structure Review`,"meeting"
  );

  // Seed add-ons
  sqlite.prepare(`INSERT INTO add_ons (client_id, project_id, type, title, description, price, status, visible) VALUES (?,?,?,?,?,?,?,?)`).run(
    1,1,"retainer","Monthly Strategy Retainer","Ongoing monthly advisory and implementation support post-Foundation","997","recommended",1
  );
  sqlite.prepare(`INSERT INTO add_ons (client_id, project_id, type, title, description, price, status, visible) VALUES (?,?,?,?,?,?,?,?)`).run(
    1,1,"strategy_intensive","Business Launch Add-On","Upgrade to the full P.E.S. Business Launch after Foundation completion","3000","recommended",1
  );

  // Seed automation events
  const events = [
    ["lead_created","lead",1,"Lead BECS-L-001 created from referral intake"],
    ["proposal_sent","lead",1,"Proposal BECS-PR-001 sent to Maria Delgado"],
    ["proposal_accepted","lead",1,"Proposal accepted — client conversion triggered"],
    ["client_activated","client",1,"Client account BECS-C-001 activated"],
    ["portal_access_granted","client",1,"Portal access granted to maria@bornapparelstudio.com"],
    ["onboarding_started","client",1,"Onboarding checklist populated and sent"],
    ["kickoff_logged","project",1,"Kickoff meeting logged — project BECS-P-001 set to active"],
  ];
  for (const [type, entityType, entityId, description] of events) {
    sqlite.prepare(`INSERT INTO automation_events (type, entity_type, entity_id, description, status) VALUES (?,?,?,?,?)`).run(type, entityType, entityId, description, "success");
  }
}

migrate();

// ─── STORAGE INTERFACE ────────────────────────────────────────────────────────
export const storage = {
  // Dashboard stats
  getDashboardStats() {
    const totalLeads = (sqlite.prepare("SELECT COUNT(*) as c FROM leads").get() as any).c;
    const activeClients = (sqlite.prepare("SELECT COUNT(*) as c FROM clients WHERE status='active'").get() as any).c;
    const activeProjects = (sqlite.prepare("SELECT COUNT(*) as c FROM projects WHERE status='active'").get() as any).c;
    const revenue = (sqlite.prepare("SELECT SUM(amount) as s FROM legal_docs WHERE status='paid'").get() as any).s || 0;
    const newLeads = (sqlite.prepare("SELECT COUNT(*) as c FROM leads WHERE status='new'").get() as any).c;
    const upcomingMeetings = (sqlite.prepare("SELECT COUNT(*) as c FROM meetings WHERE status='scheduled'").get() as any).c;
    return { totalLeads, activeClients, activeProjects, revenue, newLeads, upcomingMeetings };
  },

  // Leads
  getLeads(): Lead[] { return db.select().from(leads).orderBy(desc(leads.createdAt)).all(); },
  getLeadById(id: number): Lead | undefined { return db.select().from(leads).where(eq(leads.id, id)).get(); },
  createLead(data: InsertLead): Lead { return db.insert(leads).values(data).returning().get(); },
  updateLead(id: number, data: Partial<InsertLead>): Lead | undefined {
    return db.update(leads).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(leads.id, id)).returning().get();
  },
  deleteLead(id: number) { db.delete(leads).where(eq(leads.id, id)).run(); },

  // Clients
  getClients(): Client[] { return db.select().from(clients).orderBy(desc(clients.createdAt)).all(); },
  getClientById(id: number): Client | undefined { return db.select().from(clients).where(eq(clients.id, id)).get(); },
  createClient(data: InsertClient): Client { return db.insert(clients).values(data).returning().get(); },
  updateClient(id: number, data: Partial<InsertClient>): Client | undefined {
    return db.update(clients).set(data).where(eq(clients.id, id)).returning().get();
  },
  deleteClient(id: number) { db.delete(clients).where(eq(clients.id, id)).run(); },

  // Projects
  getProjects(): Project[] { return db.select().from(projects).orderBy(desc(projects.createdAt)).all(); },
  getProjectsByClient(clientId: number): Project[] { return db.select().from(projects).where(eq(projects.clientId, clientId)).all(); },
  getProjectById(id: number): Project | undefined { return db.select().from(projects).where(eq(projects.id, id)).get(); },
  createProject(data: InsertProject): Project { return db.insert(projects).values(data).returning().get(); },
  updateProject(id: number, data: Partial<InsertProject>): Project | undefined {
    return db.update(projects).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(projects.id, id)).returning().get();
  },

  // Milestones
  getMilestonesByProject(projectId: number): Milestone[] {
    return db.select().from(milestones).where(eq(milestones.projectId, projectId)).orderBy(milestones.sortOrder).all();
  },
  createMilestone(data: InsertMilestone): Milestone { return db.insert(milestones).values(data).returning().get(); },
  updateMilestone(id: number, data: Partial<InsertMilestone>): Milestone | undefined {
    return db.update(milestones).set(data).where(eq(milestones.id, id)).returning().get();
  },
  deleteMilestone(id: number) { db.delete(milestones).where(eq(milestones.id, id)).run(); },

  // Onboarding
  getOnboardingItems(clientId: number): OnboardingItem[] {
    return db.select().from(onboardingItems).where(eq(onboardingItems.clientId, clientId)).orderBy(onboardingItems.sortOrder).all();
  },
  updateOnboardingItem(id: number, data: Partial<InsertOnboardingItem>): OnboardingItem | undefined {
    return db.update(onboardingItems).set(data).where(eq(onboardingItems.id, id)).returning().get();
  },

  // Meetings
  getMeetings(): Meeting[] { return db.select().from(meetings).orderBy(desc(meetings.scheduledAt)).all(); },
  getMeetingsByClient(clientId: number): Meeting[] {
    return db.select().from(meetings).where(eq(meetings.clientId, clientId)).orderBy(desc(meetings.scheduledAt)).all();
  },
  createMeeting(data: InsertMeeting): Meeting { return db.insert(meetings).values(data).returning().get(); },
  updateMeeting(id: number, data: Partial<InsertMeeting>): Meeting | undefined {
    return db.update(meetings).set(data).where(eq(meetings.id, id)).returning().get();
  },

  // Proposals
  getProposals(): Proposal[] { return db.select().from(proposals).orderBy(desc(proposals.createdAt)).all(); },
  getProposalsByLead(leadId: number): Proposal[] { return db.select().from(proposals).where(eq(proposals.leadId, leadId)).all(); },
  createProposal(data: InsertProposal): Proposal { return db.insert(proposals).values(data).returning().get(); },
  updateProposal(id: number, data: Partial<InsertProposal>): Proposal | undefined {
    return db.update(proposals).set(data).where(eq(proposals.id, id)).returning().get();
  },

  // Legal Docs
  getLegalDocs(): LegalDoc[] { return db.select().from(legalDocs).orderBy(desc(legalDocs.createdAt)).all(); },
  getLegalDocsByClient(clientId: number): LegalDoc[] { return db.select().from(legalDocs).where(eq(legalDocs.clientId, clientId)).all(); },
  createLegalDoc(data: InsertLegalDoc): LegalDoc { return db.insert(legalDocs).values(data).returning().get(); },
  updateLegalDoc(id: number, data: Partial<InsertLegalDoc>): LegalDoc | undefined {
    return db.update(legalDocs).set(data).where(eq(legalDocs.id, id)).returning().get();
  },

  // Recaps
  getRecaps(): Recap[] { return db.select().from(recaps).orderBy(desc(recaps.generatedAt)).all(); },
  getRecapsByClient(clientId: number): Recap[] { return db.select().from(recaps).where(eq(recaps.clientId, clientId)).all(); },
  createRecap(data: InsertRecap): Recap { return db.insert(recaps).values(data).returning().get(); },

  // Add-ons
  getAddOnsByClient(clientId: number): AddOn[] {
    return db.select().from(addOns).where(and(eq(addOns.clientId, clientId), eq(addOns.visible, 1))).all();
  },
  createAddOn(data: InsertAddOn): AddOn { return db.insert(addOns).values(data).returning().get(); },
  updateAddOn(id: number, data: Partial<InsertAddOn>): AddOn | undefined {
    return db.update(addOns).set(data).where(eq(addOns.id, id)).returning().get();
  },

  // Automation events
  getAutomationEvents(): AutomationEvent[] {
    return db.select().from(automationEvents).orderBy(desc(automationEvents.triggeredAt)).all();
  },
  logAutomationEvent(type: string, entityType: string, entityId: number, description: string, status = "success") {
    db.insert(automationEvents).values({ type, entityType, entityId, description, status, triggeredAt: new Date().toISOString() }).run();
  },
};
