-- Agrega columna status para flujo de aprobación de usuarios backoffice
DO $$ BEGIN
  CREATE TYPE admin_user_status AS ENUM ('pending', 'active', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS status admin_user_status DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users (status);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users (role);
