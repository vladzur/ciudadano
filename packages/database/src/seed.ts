import { pool } from "./client.js";
import bcrypt from "bcrypt";

async function seed(): Promise<void> {
  console.log("🌱 Sembrando datos de prueba...");

  // Crear usuario admin por defecto
  const adminPassword = await bcrypt.hash("admin123", 10);
  await pool.query(
    `INSERT INTO admin_users (email, password, name, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    ["admin@villarrica.cl", adminPassword, "Administrador", "admin"]
  );
  console.log("  ✓ Usuario admin creado (admin@villarrica.cl / admin123)");

  // Crear denuncias de prueba en Villarrica
  const testReports = [
    {
      description: "Luminaria apagada en intersección de Av. Los Laureles con Caupolicán. Lleva 2 semanas sin funcionar.",
      lat: -39.2785, lng: -72.2284,
      category: "Luminarias",
    },
    {
      description: "Bache profundo en calle General Urrutia, peligro para vehículos y ciclistas.",
      lat: -39.2792, lng: -72.2271,
      category: "Baches",
    },
    {
      description: "Acumulación de basura en esquina de Pedro de Valdivia con Matta.",
      lat: -39.2778, lng: -72.2295,
      category: "Aseo",
    },
    {
      description: "Poca iluminación en pasaje Las Rosas, sensación de inseguridad por las noches.",
      lat: -39.2801, lng: -72.2260,
      category: "Seguridad",
    },
    {
      description: "Semáforo intermitente en cruce de Av. Los Laureles con Manuel Rodríguez.",
      lat: -39.2770, lng: -72.2301,
      category: "Tráfico",
    },
  ];

  for (const report of testReports) {
    await pool.query(
      `INSERT INTO reports (description, location, category)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4)`,
      [report.description, report.lng, report.lat, report.category]
    );
  }
  console.log(`  ✓ ${testReports.length} denuncias de prueba creadas`);

  console.log("✅ Datos de prueba sembrados");
  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
