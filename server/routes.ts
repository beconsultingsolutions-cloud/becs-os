import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertClientSchema, insertProjectSchema, insertMilestoneSchema, insertMeetingSchema, insertProposalSchema, insertLegalDocSchema, insertRecapSchema, insertAddOnSchema } from "@shared/schema";

export async function registerRoutes(httpServer: Server, app: Express): Promise<void> {
  // Dashboard
  app.get("/api/dashboard/stats", async (_req, res) => {
    res.json(await storage.getDashboardStats());
  });

  // Leads
  app.get("/api/leads", async (_req, res) => res.json(await storage.getLeads()));
  app.get("/api/leads/:id", async (req, res) => {
    const lead = await storage.getLeadById(Number(req.params.id));
    lead ? res.json(lead) : res.status(404).json({ error: "Lead not found" });
  });
  app.post("/api/leads", async (req, res) => {
    try {
      const data = insertLeadSchema.parse(req.body);
      const allLeads = await storage.getLeads();
      const lead = await storage.createLead({ ...data, leadId: `BECS-L-${String(allLeads.length + 1).padStart(3, "0")}` });
      await storage.logAutomationEvent("lead_created", "lead", lead.id, `Lead ${lead.leadId} created`);
      res.status(201).json(lead);
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });
  app.patch("/api/leads/:id", async (req, res) => {
    const lead = await storage.updateLead(Number(req.params.id), req.body);
    lead ? res.json(lead) : res.status(404).json({ error: "Lead not found" });
  });
  app.delete("/api/leads/:id", async (req, res) => {
    await storage.deleteLead(Number(req.params.id));
    res.json({ success: true });
  });

  // Clients
  app.get("/api/clients", async (_req, res) => res.json(await storage.getClients()));
  app.get("/api/clients/:id", async (req, res) => {
    const client = await storage.getClientById(Number(req.params.id));
    client ? res.json(client) : res.status(404).json({ error: "Client not found" });
  });
  app.post("/api/clients", async (req, res) => {
    try {
      const data = insertClientSchema.parse(req.body);
      const allClients = await storage.getClients();
      const client = await storage.createClient({ ...data, clientId: `BECS-C-${String(allClients.length + 1).padStart(3, "0")}` });
      await storage.logAutomationEvent("client_activated", "client", client.id, `Client account ${client.clientId} activated`);
      res.status(201).json(client);
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });
  app.patch("/api/clients/:id", async (req, res) => {
    const client = await storage.updateClient(Number(req.params.id), req.body);
    client ? res.json(client) : res.status(404).json({ error: "Client not found" });
  });
  app.delete("/api/clients/:id", async (req, res) => {
    await storage.deleteClient(Number(req.params.id));
    res.json({ success: true });
  });

  // Projects
  app.get("/api/projects", async (_req, res) => res.json(await storage.getProjects()));
  app.get("/api/projects/client/:clientId", async (req, res) => res.json(await storage.getProjectsByClient(Number(req.params.clientId))));
  app.get("/api/projects/:id", async (req, res) => {
    const project = await storage.getProjectById(Number(req.params.id));
    project ? res.json(project) : res.status(404).json({ error: "Project not found" });
  });
  app.post("/api/projects", async (req, res) => {
    try {
      const data = insertProjectSchema.parse(req.body);
      const allProjects = await storage.getProjects();
      const project = await storage.createProject({ ...data, projectId: `BECS-P-${String(allProjects.length + 1).padStart(3, "0")}` });
      res.status(201).json(project);
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });
  app.patch("/api/projects/:id", async (req, res) => {
    const project = await storage.updateProject(Number(req.params.id), req.body);
    project ? res.json(project) : res.status(404).json({ error: "Project not found" });
  });

  // Milestones
  app.get("/api/milestones/project/:projectId", async (req, res) => res.json(await storage.getMilestonesByProject(Number(req.params.projectId))));
  app.post("/api/milestones", async (req, res) => {
    try {
      const data = insertMilestoneSchema.parse(req.body);
      res.status(201).json(await storage.createMilestone(data));
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });
  app.patch("/api/milestones/:id", async (req, res) => {
    const m = await storage.updateMilestone(Number(req.params.id), req.body);
    m ? res.json(m) : res.status(404).json({ error: "Milestone not found" });
  });
  app.delete("/api/milestones/:id", async (req, res) => {
    await storage.deleteMilestone(Number(req.params.id));
    res.json({ success: true });
  });

  // Onboarding
  app.get("/api/onboarding/:clientId", async (req, res) => res.json(await storage.getOnboardingItems(Number(req.params.clientId))));
  app.patch("/api/onboarding/item/:id", async (req, res) => {
    const item = await storage.updateOnboardingItem(Number(req.params.id), req.body);
    item ? res.json(item) : res.status(404).json({ error: "Item not found" });
  });

  // Meetings
  app.get("/api/meetings", async (_req, res) => res.json(await storage.getMeetings()));
  app.get("/api/meetings/client/:clientId", async (req, res) => res.json(await storage.getMeetingsByClient(Number(req.params.clientId))));
  app.post("/api/meetings", async (req, res) => {
    try {
      const data = insertMeetingSchema.parse(req.body);
      res.status(201).json(await storage.createMeeting(data));
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });
  app.patch("/api/meetings/:id", async (req, res) => {
    const m = await storage.updateMeeting(Number(req.params.id), req.body);
    m ? res.json(m) : res.status(404).json({ error: "Meeting not found" });
  });

  // Proposals
  app.get("/api/proposals", async (_req, res) => res.json(await storage.getProposals()));
  app.get("/api/proposals/lead/:leadId", async (req, res) => res.json(await storage.getProposalsByLead(Number(req.params.leadId))));
  app.post("/api/proposals", async (req, res) => {
    try {
      const data = insertProposalSchema.parse(req.body);
      const allProposals = await storage.getProposals();
      const proposal = await storage.createProposal({ ...data, proposalId: `BECS-PR-${String(allProposals.length + 1).padStart(3, "0")}` });
      await storage.logAutomationEvent("proposal_created", "lead", proposal.leadId || 0, `Proposal ${proposal.proposalId} created`);
      res.status(201).json(proposal);
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });
  app.patch("/api/proposals/:id", async (req, res) => {
    const p = await storage.updateProposal(Number(req.params.id), req.body);
    p ? res.json(p) : res.status(404).json({ error: "Proposal not found" });
  });

  // Legal Docs
  app.get("/api/legal", async (_req, res) => res.json(await storage.getLegalDocs()));
  app.get("/api/legal/client/:clientId", async (req, res) => res.json(await storage.getLegalDocsByClient(Number(req.params.clientId))));
  app.post("/api/legal", async (req, res) => {
    try {
      const data = insertLegalDocSchema.parse(req.body);
      const allDocs = await storage.getLegalDocs();
      const doc = await storage.createLegalDoc({ ...data, docId: `BECS-DOC-${String(allDocs.length + 1).padStart(3, "0")}` });
      res.status(201).json(doc);
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });
  app.patch("/api/legal/:id", async (req, res) => {
    const doc = await storage.updateLegalDoc(Number(req.params.id), req.body);
    doc ? res.json(doc) : res.status(404).json({ error: "Document not found" });
  });

  // Recaps
  app.get("/api/recaps", async (_req, res) => res.json(await storage.getRecaps()));
  app.get("/api/recaps/client/:clientId", async (req, res) => res.json(await storage.getRecapsByClient(Number(req.params.clientId))));
  app.post("/api/recaps", async (req, res) => {
    try {
      const data = insertRecapSchema.parse(req.body);
      res.status(201).json(await storage.createRecap(data));
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });

  // Add-ons
  app.get("/api/addons/client/:clientId", async (req, res) => res.json(await storage.getAddOnsByClient(Number(req.params.clientId))));
  app.post("/api/addons", async (req, res) => {
    try {
      const data = insertAddOnSchema.parse(req.body);
      res.status(201).json(await storage.createAddOn(data));
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });
  app.patch("/api/addons/:id", async (req, res) => {
    const a = await storage.updateAddOn(Number(req.params.id), req.body);
    a ? res.json(a) : res.status(404).json({ error: "Add-on not found" });
  });

  // Automation Events
  app.get("/api/automation-events", async (_req, res) => res.json(await storage.getAutomationEvents()));
}
