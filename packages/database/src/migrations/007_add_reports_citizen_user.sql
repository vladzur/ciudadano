-- Vincula denuncias con el usuario ciudadano autenticado que las creó
ALTER TABLE reports ADD COLUMN IF NOT EXISTS citizen_user_id UUID REFERENCES citizen_users(id);

CREATE INDEX IF NOT EXISTS idx_reports_citizen_user ON reports (citizen_user_id);
