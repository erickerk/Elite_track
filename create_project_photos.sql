-- Tabela de fotos do projeto (galeria)
CREATE TABLE IF NOT EXISTS project_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL DEFAULT 'general',
  stage TEXT,
  description TEXT,
  taken_by TEXT,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_photos_project ON project_photos(project_id);
CREATE INDEX IF NOT EXISTS idx_project_photos_type ON project_photos(photo_type);
CREATE INDEX IF NOT EXISTS idx_project_photos_stage ON project_photos(stage);

ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view project photos" ON project_photos;
CREATE POLICY "Anyone can view project photos" ON project_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert project photos" ON project_photos;
CREATE POLICY "Anyone can insert project photos" ON project_photos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update project photos" ON project_photos;
CREATE POLICY "Anyone can update project photos" ON project_photos FOR UPDATE USING (true);
