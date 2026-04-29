-- ============================================================
-- Sayothix Caller - Supabase Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com → your project → SQL)
-- ============================================================

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  niche TEXT NOT NULL DEFAULT 'Other',
  contact_name TEXT,
  phone TEXT NOT NULL,
  gaps TEXT[] DEFAULT '{}',
  reviews_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'called', 'appointment', 'call-back', 'not-interested', 'no-answer', 'not-in-service')),
  last_call_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leads_phone_idx ON leads(phone);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);

-- Calls table
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
