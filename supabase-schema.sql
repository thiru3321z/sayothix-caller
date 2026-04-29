-- ============================================================
-- Sayothix Caller - Database Schema v2
-- Run this in Supabase SQL Editor
-- Safe to re-run (uses IF NOT EXISTS)
-- ============================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  niche TEXT NOT NULL DEFAULT 'Other',
  contact_name TEXT,
  phone TEXT NOT NULL,
  gaps TEXT[] DEFAULT '{}',
  reviews_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  website TEXT,
  website_status TEXT DEFAULT 'unknown',
  address TEXT,
  google_maps_link TEXT,
  priority TEXT DEFAULT 'warm',
  analysis_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  last_call_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrade existing v1 tables (safe to run multiple times)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS website_status TEXT DEFAULT 'unknown';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS google_maps_link TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'warm';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS analysis_notes TEXT;

CREATE INDEX IF NOT EXISTS leads_phone_idx ON leads(phone);
CREATE INDEX IF NOT EXISTS leads_priority_idx ON leads(priority);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);

CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  vapi_call_id TEXT,
  duration_seconds INTEGER DEFAULT 0,
  outcome TEXT NOT NULL,
  transcript JSONB DEFAULT '[]'::jsonb,
  recording_url TEXT,
  notes TEXT,
  meeting_time TEXT,
  meet_link TEXT,
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS calls_lead_id_idx ON calls(lead_id);
CREATE INDEX IF NOT EXISTS calls_created_at_idx ON calls(created_at DESC);
