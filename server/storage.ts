import supabase from "./supabase";
import type {
  Lead, Client, Project, Milestone, Meeting, Proposal,
  LegalDoc, Recap, AddOn, OnboardingItem, AutomationEvent,
  InsertLead, InsertClient, InsertProject, InsertMilestone, InsertMeeting,
  InsertProposal, InsertLegalDoc, InsertRecap, InsertAddOn, InsertOnboardingItem,
} from "@shared/schema";

// ─── CAMEL ↔ SNAKE HELPERS ────────────────────────────────────────────────────
function toSnake(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)] = v;
  }
  return out;
}

function toCamel(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return out;
}

function toCamelArray<T>(rows: Record<string, any>[]): T[] {
  return rows.map((r) => toCamel(r) as T);
}

// ─── STORAGE INTERFACE ────────────────────────────────────────────────────────
export const storage = {
  // Dashboard stats
  async getDashboardStats() {
    const [leadsRes, clientsRes, projectsRes, revenueRes, newLeadsRes, meetingsRes] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("legal_docs").select("amount").eq("status", "paid"),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("meetings").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
    ]);
    const revenue = (revenueRes.data || []).reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
    return {
      totalLeads: leadsRes.count || 0,
      activeClients: clientsRes.count || 0,
      activeProjects: projectsRes.count || 0,
      revenue,
      newLeads: newLeadsRes.count || 0,
      upcomingMeetings: meetingsRes.count || 0,
    };
  },

  // Leads
  async getLeads(): Promise<Lead[]> {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    return toCamelArray<Lead>(data || []);
  },
  async getLeadById(id: number): Promise<Lead | undefined> {
    const { data } = await supabase.from("leads").select("*").eq("id", id).single();
    return data ? (toCamel(data) as Lead) : undefined;
  },
  async createLead(input: InsertLead): Promise<Lead> {
    const { data } = await supabase.from("leads").insert(toSnake(input)).select().single();
    return toCamel(data!) as Lead;
  },
  async updateLead(id: number, input: Partial<InsertLead>): Promise<Lead | undefined> {
    const payload = { ...toSnake(input), updated_at: new Date().toISOString() };
    const { data } = await supabase.from("leads").update(payload).eq("id", id).select().single();
    return data ? (toCamel(data) as Lead) : undefined;
  },
  async deleteLead(id: number) {
    await supabase.from("leads").delete().eq("id", id);
  },

  // Clients
  async getClients(): Promise<Client[]> {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    return toCamelArray<Client>(data || []);
  },
  async getClientById(id: number): Promise<Client | undefined> {
    const { data } = await supabase.from("clients").select("*").eq("id", id).single();
    return data ? (toCamel(data) as Client) : undefined;
  },
  async createClient(input: InsertClient): Promise<Client> {
    const { data } = await supabase.from("clients").insert(toSnake(input)).select().single();
    return toCamel(data!) as Client;
  },
  async updateClient(id: number, input: Partial<InsertClient>): Promise<Client | undefined> {
    const { data } = await supabase.from("clients").update(toSnake(input)).eq("id", id).select().single();
    return data ? (toCamel(data) as Client) : undefined;
  },
  async deleteClient(id: number) {
    await supabase.from("clients").delete().eq("id", id);
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    return toCamelArray<Project>(data || []);
  },
  async getProjectsByClient(clientId: number): Promise<Project[]> {
    const { data } = await supabase.from("projects").select("*").eq("client_id", clientId);
    return toCamelArray<Project>(data || []);
  },
  async getProjectById(id: number): Promise<Project | undefined> {
    const { data } = await supabase.from("projects").select("*").eq("id", id).single();
    return data ? (toCamel(data) as Project) : undefined;
  },
  async createProject(input: InsertProject): Promise<Project> {
    const { data } = await supabase.from("projects").insert(toSnake(input)).select().single();
    return toCamel(data!) as Project;
  },
  async updateProject(id: number, input: Partial<InsertProject>): Promise<Project | undefined> {
    const payload = { ...toSnake(input), updated_at: new Date().toISOString() };
    const { data } = await supabase.from("projects").update(payload).eq("id", id).select().single();
    return data ? (toCamel(data) as Project) : undefined;
  },

  // Milestones
  async getMilestonesByProject(projectId: number): Promise<Milestone[]> {
    const { data } = await supabase.from("milestones").select("*").eq("project_id", projectId).order("sort_order");
    return toCamelArray<Milestone>(data || []);
  },
  async createMilestone(input: InsertMilestone): Promise<Milestone> {
    const { data } = await supabase.from("milestones").insert(toSnake(input)).select().single();
    return toCamel(data!) as Milestone;
  },
  async updateMilestone(id: number, input: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    const { data } = await supabase.from("milestones").update(toSnake(input)).eq("id", id).select().single();
    return data ? (toCamel(data) as Milestone) : undefined;
  },
  async deleteMilestone(id: number) {
    await supabase.from("milestones").delete().eq("id", id);
  },

  // Onboarding
  async getOnboardingItems(clientId: number): Promise<OnboardingItem[]> {
    const { data } = await supabase.from("onboarding_items").select("*").eq("client_id", clientId).order("sort_order");
    return toCamelArray<OnboardingItem>(data || []);
  },
  async updateOnboardingItem(id: number, input: Partial<InsertOnboardingItem>): Promise<OnboardingItem | undefined> {
    const { data } = await supabase.from("onboarding_items").update(toSnake(input)).eq("id", id).select().single();
    return data ? (toCamel(data) as OnboardingItem) : undefined;
  },

  // Meetings
  async getMeetings(): Promise<Meeting[]> {
    const { data } = await supabase.from("meetings").select("*").order("scheduled_at", { ascending: false });
    return toCamelArray<Meeting>(data || []);
  },
  async getMeetingsByClient(clientId: number): Promise<Meeting[]> {
    const { data } = await supabase.from("meetings").select("*").eq("client_id", clientId).order("scheduled_at", { ascending: false });
    return toCamelArray<Meeting>(data || []);
  },
  async createMeeting(input: InsertMeeting): Promise<Meeting> {
    const { data } = await supabase.from("meetings").insert(toSnake(input)).select().single();
    return toCamel(data!) as Meeting;
  },
  async updateMeeting(id: number, input: Partial<InsertMeeting>): Promise<Meeting | undefined> {
    const { data } = await supabase.from("meetings").update(toSnake(input)).eq("id", id).select().single();
    return data ? (toCamel(data) as Meeting) : undefined;
  },

  // Proposals
  async getProposals(): Promise<Proposal[]> {
    const { data } = await supabase.from("proposals").select("*").order("created_at", { ascending: false });
    return toCamelArray<Proposal>(data || []);
  },
  async getProposalsByLead(leadId: number): Promise<Proposal[]> {
    const { data } = await supabase.from("proposals").select("*").eq("lead_id", leadId);
    return toCamelArray<Proposal>(data || []);
  },
  async createProposal(input: InsertProposal): Promise<Proposal> {
    const { data } = await supabase.from("proposals").insert(toSnake(input)).select().single();
    return toCamel(data!) as Proposal;
  },
  async updateProposal(id: number, input: Partial<InsertProposal>): Promise<Proposal | undefined> {
    const { data } = await supabase.from("proposals").update(toSnake(input)).eq("id", id).select().single();
    return data ? (toCamel(data) as Proposal) : undefined;
  },

  // Legal Docs
  async getLegalDocs(): Promise<LegalDoc[]> {
    const { data } = await supabase.from("legal_docs").select("*").order("created_at", { ascending: false });
    return toCamelArray<LegalDoc>(data || []);
  },
  async getLegalDocsByClient(clientId: number): Promise<LegalDoc[]> {
    const { data } = await supabase.from("legal_docs").select("*").eq("client_id", clientId);
    return toCamelArray<LegalDoc>(data || []);
  },
  async createLegalDoc(input: InsertLegalDoc): Promise<LegalDoc> {
    const { data } = await supabase.from("legal_docs").insert(toSnake(input)).select().single();
    return toCamel(data!) as LegalDoc;
  },
  async updateLegalDoc(id: number, input: Partial<InsertLegalDoc>): Promise<LegalDoc | undefined> {
    const { data } = await supabase.from("legal_docs").update(toSnake(input)).eq("id", id).select().single();
    return data ? (toCamel(data) as LegalDoc) : undefined;
  },

  // Recaps
  async getRecaps(): Promise<Recap[]> {
    const { data } = await supabase.from("recaps").select("*").order("generated_at", { ascending: false });
    return toCamelArray<Recap>(data || []);
  },
  async getRecapsByClient(clientId: number): Promise<Recap[]> {
    const { data } = await supabase.from("recaps").select("*").eq("client_id", clientId);
    return toCamelArray<Recap>(data || []);
  },
  async createRecap(input: InsertRecap): Promise<Recap> {
    const { data } = await supabase.from("recaps").insert(toSnake(input)).select().single();
    return toCamel(data!) as Recap;
  },

  // Add-ons
  async getAddOnsByClient(clientId: number): Promise<AddOn[]> {
    const { data } = await supabase.from("add_ons").select("*").eq("client_id", clientId).eq("visible", true);
    return toCamelArray<AddOn>(data || []);
  },
  async createAddOn(input: InsertAddOn): Promise<AddOn> {
    const { data } = await supabase.from("add_ons").insert(toSnake(input)).select().single();
    return toCamel(data!) as AddOn;
  },
  async updateAddOn(id: number, input: Partial<InsertAddOn>): Promise<AddOn | undefined> {
    const { data } = await supabase.from("add_ons").update(toSnake(input)).eq("id", id).select().single();
    return data ? (toCamel(data) as AddOn) : undefined;
  },

  // Automation events
  async getAutomationEvents(): Promise<AutomationEvent[]> {
    const { data } = await supabase.from("automation_events").select("*").order("triggered_at", { ascending: false });
    return toCamelArray<AutomationEvent>(data || []);
  },
  async logAutomationEvent(type: string, entityType: string, entityId: number, description: string, status = "success") {
    await supabase.from("automation_events").insert({
      type, entity_type: entityType, entity_id: entityId, description, status,
    });
  },
};
