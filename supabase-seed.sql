-- BECS OS — Seed Data for Supabase

-- Leads
INSERT INTO leads (lead_id, name, business_name, email, phone, business_stage, service_interest, goals, pain_points, timeline, budget_comfort, referral_source, status, qualification_notes, recommended_path, next_step) VALUES
  ('BECS-L-001','Maria Delgado','Born Apparel Studio','maria@bornapparelstudio.com','+1 312 555 0101','established','foundation_builder','Build a scalable service model and client experience','Inconsistent revenue, no defined offer structure','90 days','high','referral','proposal','Strong fit — apparel brand with growth goals','path_c','Send proposal'),
  ('BECS-L-002','James Carter','Carter Co.','james@carterco.com','+1 773 555 0202','startup','reality_check','Understand where to start','No clear business plan or pricing','60 days','mid','linkedin','reviewing', NULL, NULL, NULL),
  ('BECS-L-003','Nia Williams','NW Creative','nia@nwcreative.co','+1 847 555 0303','growing','business_launch','Launch a new service line','Lack of structure, no sales process','45 days','high','website','discovery', NULL, NULL, NULL);

-- Clients
INSERT INTO clients (client_id, lead_id, name, business_name, email, phone, portal_access_active, status, onboarding_complete) VALUES
  ('BECS-C-001', 1, 'Maria Delgado', 'Born Apparel Studio', 'maria@bornapparelstudio.com', '+1 312 555 0101', TRUE, 'active', TRUE);

-- Projects
INSERT INTO projects (project_id, client_id, service_type, title, status, current_phase, total_phases, progress_percent, start_date, target_end_date) VALUES
  ('BECS-P-001', 1, 'foundation_builder', 'Foundation Builder — Born Apparel Studio', 'active', 'Offer Structure', 6, 33, '2026-03-15', '2026-06-15');

-- Milestones
INSERT INTO milestones (project_id, title, description, status, due_date, client_action_required, sort_order) VALUES
  (1, 'Intake & Business Audit', 'Complete intake form and initial audit', 'complete', '2026-03-22', FALSE, 0),
  (1, 'Offer Structure', 'Define service offerings and packages', 'in_progress', '2026-04-05', FALSE, 1),
  (1, 'Pricing Strategy', 'Finalize pricing model and tiers', 'pending', '2026-04-19', TRUE, 2),
  (1, 'Client Experience Design', 'Map the client journey end to end', 'pending', '2026-05-03', FALSE, 3),
  (1, 'Operations Framework', 'Build SOPs and workflow documentation', 'pending', '2026-05-17', FALSE, 4),
  (1, 'Final Delivery & Review', 'Present complete foundation package', 'pending', '2026-06-07', FALSE, 5);

-- Onboarding Items
INSERT INTO onboarding_items (client_id, item, status, sort_order) VALUES
  (1, 'Complete onboarding intake form', 'complete', 0),
  (1, 'Review portal walkthrough video', 'complete', 1),
  (1, 'Acknowledge roles & responsibilities', 'complete', 2),
  (1, 'Upload business overview document', 'complete', 3),
  (1, 'Confirm primary contact info', 'pending', 4),
  (1, 'Schedule kickoff meeting', 'pending', 5);

-- Meetings
INSERT INTO meetings (client_id, project_id, type, title, scheduled_at, duration, status, notes, recap) VALUES
  (1, 1, 'kickoff', 'Kickoff — Born Apparel Studio', '2026-03-22T14:00:00', 60, 'completed', 'Client confirmed goals and priorities. Strong alignment on offer structure focus.', 'Confirmed 6-phase Foundation Builder. Client will provide brand materials by Mar 29. Next meeting: Offer Structure review on Apr 5.'),
  (1, 1, 'check_in', 'Offer Structure Review', '2026-04-05T14:00:00', 60, 'scheduled', NULL, NULL);

-- Proposals
INSERT INTO proposals (proposal_id, lead_id, service_type, title, scope, price, timeline, deliverables, nda_required, status, sent_at, accepted_at) VALUES
  ('BECS-PR-001', 1, 'foundation_builder', 'Foundation Builder Proposal — Born Apparel Studio', 'Full business foundation audit, offer structure, pricing strategy, client experience design, and operations framework', 2497, '90 days', '["Business audit","Offer framework","Pricing structure","Client experience map","Operations guide","Strategy session x3"]', FALSE, 'accepted', '2026-03-10', '2026-03-14');

-- Legal Docs
INSERT INTO legal_docs (doc_id, client_id, project_id, type, title, status, signed_at, amount, paid_at) VALUES
  ('BECS-DOC-001', 1, 1, 'agreement', 'Service Agreement — Foundation Builder', 'signed', '2026-03-14', 2497, '2026-03-14'),
  ('BECS-DOC-002', 1, 1, 'invoice', 'Invoice #001 — Foundation Builder', 'paid', NULL, 2497, NULL);

-- Recaps
INSERT INTO recaps (client_id, project_id, type, title, content, source) VALUES
  (1, 1, 'milestone', 'Kickoff Recap — Born Apparel Studio', E'**Meeting:** Kickoff — March 22, 2026\n\n**Goals Confirmed:**\n- Build a scalable service model for Born Apparel Studio\n- Create clear offer tiers for clients\n- Establish pricing structure\n\n**Priorities:**\n1. Offer structure (most urgent)\n2. Pricing clarity\n3. Client journey mapping\n\n**Deliverables:**\n- Brand materials due March 29\n- Phase 2 review scheduled April 5\n\n**Next Step:** Offer Structure Review', 'meeting');

-- Add-ons
INSERT INTO add_ons (client_id, project_id, type, title, description, price, status, visible) VALUES
  (1, 1, 'retainer', 'Monthly Strategy Retainer', 'Ongoing monthly advisory and implementation support post-Foundation', 997, 'recommended', TRUE),
  (1, 1, 'strategy_intensive', 'Business Launch Add-On', 'Upgrade to the full P.E.S. Business Launch after Foundation completion', 3000, 'recommended', TRUE);

-- Automation Events
INSERT INTO automation_events (type, entity_type, entity_id, description, status) VALUES
  ('lead_created', 'lead', 1, 'Lead BECS-L-001 created from referral intake', 'success'),
  ('proposal_sent', 'lead', 1, 'Proposal BECS-PR-001 sent to Maria Delgado', 'success'),
  ('proposal_accepted', 'lead', 1, 'Proposal accepted — client conversion triggered', 'success'),
  ('client_activated', 'client', 1, 'Client account BECS-C-001 activated', 'success'),
  ('portal_access_granted', 'client', 1, 'Portal access granted to maria@bornapparelstudio.com', 'success'),
  ('onboarding_started', 'client', 1, 'Onboarding checklist populated and sent', 'success'),
  ('kickoff_logged', 'project', 1, 'Kickoff meeting logged — project BECS-P-001 set to active', 'success');
