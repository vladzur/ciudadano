import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate(): Promise<void> {
  const migrationsDir = join(__dirname, "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`📦 Ejecutando ${files.length} migraciones...`);

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    console.log(`  ▶ ${file}`);
    await pool.query(sql);
    console.log(`  ✓ ${file} completada`);
  }

  console.log("✅ Migraciones completadas");
  await pool.end();
}

migrate().catch((err) => {
  console.error("❌ Error en migraciones:", err);
  process.exit(1);
});
