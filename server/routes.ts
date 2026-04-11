import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertClientSchema, insertProjectSchema, insertMilestoneSchema, insertMeetingSchema, insertProposalSchema, insertLegalDocSchema, insertRecapSchema, insertAddOnSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(httpServer: Server, app: Express): Promise<void> {
  // Dashboard
  app.get("/api/dashboard/stats", (_req, res) => {
    res.json(storage.getDashboardStats());
  });

  // Leads
  app.get("/api/leads", (_req, res) => res.json(storage.getLeads()));
  app.get("/api/leads/:id", (req, res) => {
    const lead = storage.getLeadById(Number(req.params.id));
    lead ? res.json(lead) : res.status(404).json({ error: "Lead not found" });
  });
  app.post("/api/leads", (req, res) => {
    try {
      const data = insertLeadSchema.parse(req.body);
      const count = storage.getLeads().length;
      const lead = storage.createLead({ ...data, leadId: `BECS-L-${String(count + 1).padStart(3, "0")}` });
      storage.logAutomationEvent("lead_created", "lead", lead.id, `Lead ${lead.leadId} created`);
      res.status(201).json(lead);
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });
  app.patch("/api/leads/:id", (req, res) => {
    const lead = storage.updateLead(Number(req.params.id), req.body);
    lead ? res.json(lead) : res.status(404).json({ error: "Lead not found" });
  });
  app.delete("/api/leads/:id", (req, res) => {
    storage.deleteLead(Number(req.params.id));
    res.json({ success: true });
  });

  // Clients
  app.get("/api/clients", (_req, res) => res.json(storage.getClients()));
  app.get("/api/clients/:id", (req, res) => {
    const client = storage.getClientById(Number(req.params.id));
    client ? res.json(client) : res.status(404).json({ error: "Client not found" });
  });
  app.post("/api/clients", (req, res) => {
    try {
      const data = insertClientSchema.parse(req.body);
      const count = storage.getClients().length;
      const client = storage.createClient({ ...data, clientId: `BECS-C-${String(count + 1).padStart(3, "0")}` });
      storage.logAutomationEvent("client_activated", "client", client.id, `Client account ${client.clientId} activated`);
      res.status(201).json(client);
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });
  app.patch("/api/clients/:id", (req, res) => {
    const client = storage.updateClient(Number(req.params.id), req.body);
    client ? res.json(client) : res.status(404).json({ error: "Client not found" });
  });
  app.delete("/api/clients/:id", (req, res) => {
    storage.deleteClient(Number(req.params.id));
    res.json({ success: true });
  });

  // Projects
  app.get("/api/projects", (_req, res) => res.json(storage.getProjects()));
  app.get("/api/projects/client/:clientId", (req, res) => res.json(storage.getProjectsByClient(Number(req.params.clientId))));
  app.get("/api/projects/:id", (req, res) => {
    const project = storage.getProjectById(Number(req.params.id));
    project ? res.json(project) : res.status(404).json({ error: "Project not found" });
  });
  app.post("/api/projects", (req, res) => {
    try {
      const data = insertProjectSchema.parse(req.body);
      const count = storage.getProjects().length;
      const project = storage.createProject({ ...data, projectId: `BECS-P-${String(count + 1).padStart(3, "0")}` });
      res.status(201).json(project);
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });
  app.patch("/api/projects/:id", (req, res) => {
    const project = storage.updateProject(Number(req.params.id), req.body);
    project ? res.json(project) : res.status(404).json({ error: "Project not found" });
  });

  // Milestones
  app.get("/api/milestones/project/:projectId", (req, res) => res.json(storage.getMilestonesByProject(Number(req.params.projectId))));
  app.post("/api/milestones", (req, res) => {
    try {
      const data = insertMilestoneSchema.parse(req.body);
      res.status(201).json(storage.createMilestone(data));
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });
  app.patch("/api/milestones/:id", (req, res) => {
    const m = storage.updateMilestone(Number(req.params.id), req.body);
    m ? res.json(m) : res.status(404).json({ error: "Milestone not found" });
  });
  app.delete("/api/milestones/:id", (req, res) => {
    storage.deleteMilestone(Number(req.params.id));
    res.json({ success: true });
  });

  // Onboarding
  app.get("/api/onboarding/:clientId", (req, res) => res.json(storage.getOnboardingItems(Number(req.params.clientId))));
  app.patch("/api/onboarding/item/:id", (req, res) => {
    const item = storage.updateOnboardingItem(Number(req.params.id), req.body);
    item ? res.json(item) : res.status(404).json({ error: "Item not found" });
  });

  // Meetings
  app.get("/api/meetings", (_req, res) => res.json(storage.getMeetings()));
  app.get("/api/meetings/client/:clientId", (req, res) => res.json(storage.getMeetingsByClient(Number(req.params.clientId))));
  app.post("/api/meetings", (req, res) => {
    try {
      const data = insertMeetingSchema.parse(req.body);
      res.status(201).json(storage.createMeeting(data));
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });
  app.patch("/api/meetings/:id", (req, res) => {
    const m = storage.updateMeeting(Number(req.params.id), req.body);
    m ? res.json(m) : res.status(404).json({ error: "Meeting not found" });
  });

  // Proposals
  app.get("/api/proposals", (_req, res) => res.json(storage.getProposals()));
  app.get("/api/proposals/lead/:leadId", (req, res) => res.json(storage.getProposalsByLead(Number(req.params.leadId))));
  app.post("/api/proposals", (req, res) => {
    try {
      const data = insertProposalSchema.parse(req.body);
      const count = storage.getProposals().length;
      const proposal = storage.createProposal({ ...data, proposalId: `BECS-PR-${String(count + 1).padStart(3, "0")}` });
      storage.logAutomationEvent("proposal_created", "lead", proposal.leadId || 0, `Proposal ${proposal.proposalId} created`);
      res.status(201).json(proposal);
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });
  app.patch("/api/proposals/:id", (req, res) => {
    const p = storage.updateProposal(Number(req.params.id), req.body);
    p ? res.json(p) : res.status(404).json({ error: "Proposal not found" });
  });

  // Legal Docs
  app.get("/api/legal", (_req, res) => res.json(storage.getLegalDocs()));
  app.get("/api/legal/client/:clientId", (req, res) => res.json(storage.getLegalDocsByClient(Number(req.params.clientId))));
  app.post("/api/legal", (req, res) => {
    try {
      const data = insertLegalDocSchema.parse(req.body);
      const count = storage.getLegalDocs().length;
      const doc = storage.createLegalDoc({ ...data, docId: `BECS-DOC-${String(count + 1).padStart(3, "0")}` });
      res.status(201).json(doc);
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });
  app.patch("/api/legal/:id", (req, res) => {
    const doc = storage.updateLegalDoc(Number(req.params.id), req.body);
    doc ? res.json(doc) : res.status(404).json({ error: "Document not found" });
  });

  // Recaps
  app.get("/api/recaps", (_req, res) => res.json(storage.getRecaps()));
  app.get("/api/recaps/client/:clientId", (req, res) => res.json(storage.getRecapsByClient(Number(req.params.clientId))));
  app.post("/api/recaps", (req, res) => {
    try {
      const data = insertRecapSchema.parse(req.body);
      res.status(201).json(storage.createRecap(data));
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });

  // Add-ons
  app.get("/api/addons/client/:clientId", (req, res) => res.json(storage.getAddOnsByClient(Number(req.params.clientId))));
  app.post("/api/addons", (req, res) => {
    try {
      const data = insertAddOnSchema.parse(req.body);
      res.status(201).json(storage.createAddOn(data));
    } catch (e) { res.status(400).json({ error: String(e) }); }
  });
  app.patch("/api/addons/:id", (req, res) => {
    const a = storage.updateAddOn(Number(req.params.id), req.body);
    a ? res.json(a) : res.status(404).json({ error: "Add-on not found" });
  });

  // Automation Events
  app.get("/api/automation-events", (_req, res) => res.json(storage.getAutomationEvents()));
}
