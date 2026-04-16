-- BECS OS — Supabase Migration (PostgreSQL)
-- Converts SQLite schema to PostgreSQL with proper types

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  lead_id INTEGER,
  name TEXT NOT NULL,
  business_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  portal_access_active BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  service_type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  current_phase TEXT,
  total_phases INTEGER DEFAULT 0,
  progress_percent INTEGER DEFAULT 0,
  start_date TEXT,
  target_end_date TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS milestones (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date TEXT,
  completed_at TEXT,
  sort_order INTEGER DEFAULT 0,
  client_action_required BOOLEAN DEFAULT FALSE,
  admin_notes TEXT
);

CREATE TABLE IF NOT EXISTS onboarding_items (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  item TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date TEXT,
  completed_at TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meetings (
  id SERIAL PRIMARY KEY,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposals (
  id SERIAL PRIMARY KEY,
  proposal_id TEXT NOT NULL UNIQUE,
  lead_id INTEGER,
  client_id INTEGER,
  service_type TEXT NOT NULL,
  title TEXT NOT NULL,
  scope TEXT,
  price NUMERIC,
  timeline TEXT,
  deliverables TEXT,
  included_meetings TEXT,
  nda_required BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TEXT,
  accepted_at TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legal_docs (
  id SERIAL PRIMARY KEY,
  doc_id TEXT NOT NULL UNIQUE,
  client_id INTEGER,
  lead_id INTEGER,
  project_id INTEGER,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  signed_at TEXT,
  amount NUMERIC,
  paid_at TEXT,
  square_payment_id TEXT,
  notes TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recaps (
  id SERIAL PRIMARY KEY,
  client_id INTEGER,
  lead_id INTEGER,
  project_id INTEGER,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT
);

CREATE TABLE IF NOT EXISTS add_ons (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  project_id INTEGER,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  status TEXT NOT NULL DEFAULT 'recommended',
  visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_events (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (disabled for now — admin-only access via anon key)
-- Can be enabled later when client portal auth is added
