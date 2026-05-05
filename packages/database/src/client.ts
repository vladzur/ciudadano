import pg from "pg";

const { Pool } = pg;

/** Pool de conexión a PostgreSQL con PostGIS */
export const pool = new Pool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME ?? "ciudadano",
  user: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/** Ejecuta una query parametrizada y retorna las filas */
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

/** Obtiene un cliente individual del pool para transacciones */
export async function getClient(): Promise<pg.PoolClient> {
  return pool.connect();
}
