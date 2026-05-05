-- Tabla de notas internas de seguimiento
CREATE TABLE IF NOT EXISTS internal_notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_by  VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_report ON internal_notes (report_id);
