-- Run this in your Supabase SQL Editor to create all tables
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor

-- Audits table
CREATE TABLE audits (
  id SERIAL PRIMARY KEY,
  auditor TEXT NOT NULL,
  line_id TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'in_progress',
  notes TEXT DEFAULT '',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- Audit checklist items
CREATE TABLE audit_items (
  id SERIAL PRIMARY KEY,
  audit_id INTEGER REFERENCES audits(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  result TEXT DEFAULT 'pending',
  note TEXT DEFAULT '',
  UNIQUE(audit_id, item_id)
);

-- Audit photos
CREATE TABLE audit_photos (
  id SERIAL PRIMARY KEY,
  audit_id INTEGER REFERENCES audits(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (open access for now)
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_photos ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth required)
CREATE POLICY "Allow all" ON audits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON audit_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON audit_photos FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for photos
-- NOTE: Do this manually in Supabase Dashboard → Storage → New Bucket
-- Bucket name: audit-photos
-- Public: Yes
