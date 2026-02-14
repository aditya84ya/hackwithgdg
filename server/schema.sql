
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_name TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Interested', 'Not Interested', 'Scheduled')),
  notes TEXT,
  source TEXT DEFAULT 'Manual' CHECK (source IN ('Maps', 'Manual', 'Upload')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create calls table
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  ultravox_call_id TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  summary TEXT,
  status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'missed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tone TEXT DEFAULT 'Professional' CHECK (tone IN ('Friendly', 'Professional', 'Assertive')),
  script TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  voice_speed DECIMAL(3,2) DEFAULT 1.0,
  language_style TEXT DEFAULT 'Tanglish' CHECK (language_style IN ('Tanglish', 'Formal Tamil', 'Casual Chennai')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calls_lead_id ON calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_ultravox_call_id ON calls(ultravox_call_id);
CREATE INDEX IF NOT EXISTS idx_agents_is_active ON agents(is_active);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- 5. Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for anonymous access (for development)
-- WARNING: For production, use more restrictive policies!
CREATE POLICY "Allow all operations on leads" ON leads
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on calls" ON calls
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on agents" ON agents
  FOR ALL USING (true) WITH CHECK (true);

-- 6. Create updated_at trigger for leads
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
