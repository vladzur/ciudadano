-- Crear tipo enum para estados de denuncia
DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('pending', 'in_progress', 'resolved');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabla principal de denuncias
CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  location    GEOMETRY(Point, 4326) NOT NULL,
  image_url   TEXT,
  category    VARCHAR(50) NOT NULL,
  status      report_status DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índice espacial para consultas geoespaciales (mapa de calor)
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports USING GIST (location);

-- Índices para filtros comunes
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports (category);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports (created_at);
