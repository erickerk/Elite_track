-- Create rescue_requests table
CREATE TABLE IF NOT EXISTS rescue_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  vehicle TEXT NOT NULL,
  vehicle_plate TEXT,
  rescue_type TEXT NOT NULL,
  location TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'high',
  assigned_to TEXT,
  dispatcher_notes TEXT,
  eta_minutes INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rescue_status ON rescue_requests(status);
CREATE INDEX IF NOT EXISTS idx_rescue_priority ON rescue_requests(priority);
CREATE INDEX IF NOT EXISTS idx_rescue_created ON rescue_requests(created_at);

ALTER TABLE rescue_requests ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Anyone can create rescue requests" ON rescue_requests;
DROP POLICY IF EXISTS "Anyone can view rescue requests" ON rescue_requests;
DROP POLICY IF EXISTS "Anyone can update rescue requests" ON rescue_requests;

-- Create policies
CREATE POLICY "Anyone can create rescue requests"
  ON rescue_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view rescue requests"
  ON rescue_requests FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update rescue requests"
  ON rescue_requests FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  vehicle TEXT NOT NULL,
  type TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_schedules_project ON schedules(project_id);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists
DROP POLICY IF EXISTS "Anyone can manage schedules" ON schedules;

-- Create policy
CREATE POLICY "Anyone can manage schedules"
  ON schedules FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS rescue_requests_updated_at ON rescue_requests;
DROP TRIGGER IF EXISTS schedules_updated_at ON schedules;

-- Create triggers
CREATE TRIGGER rescue_requests_updated_at
  BEFORE UPDATE ON rescue_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
