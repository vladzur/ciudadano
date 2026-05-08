-- Tabla de usuarios ciudadanos autenticados vía Firebase Auth
CREATE TABLE IF NOT EXISTS citizen_users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  email        VARCHAR(255),
  display_name VARCHAR(150),
  provider     VARCHAR(50) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  last_login   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citizen_users_firebase_uid ON citizen_users (firebase_uid);
CREATE INDEX IF NOT EXISTS idx_citizen_users_email ON citizen_users (email);
