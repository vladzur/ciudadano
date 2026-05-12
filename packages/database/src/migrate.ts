import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Ejecuta migraciones pendientes de forma idempotente */
export async function migrate(): Promise<void> {
  // Crear tabla de seguimiento si no existe
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      executed_at TIMESTAMP DEFAULT NOW()
    )
  `);

  const migrationsDir = join(__dirname, "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  // Obtener migraciones ya ejecutadas
  const { rows: executed } = await pool.query<{ name: string }>(
    "SELECT name FROM _migrations"
  );
  const executedNames = new Set(executed.map((r) => r.name));

  const pending = files.filter((f) => !executedNames.has(f));

  if (pending.length === 0) {
    console.log("No hay migraciones pendientes");
    return;
  }

  console.log(`Ejecutando ${pending.length} migraciones pendientes...`);

  for (const file of pending) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    console.log(`  ▶ ${file}`);

    // Ejecutar migración y registrar en una transacción
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`  ✓ ${file} completada`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`  ✗ ${file} falló:`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log("Migraciones completadas");
}

// Ejecución directa por CLI
const isMain = process.argv[1]?.includes("migrate");
if (isMain) {
  migrate()
    .then(() => pool.end())
    .catch((err) => {
      console.error("Error en migraciones:", err);
      process.exit(1);
    });
}
