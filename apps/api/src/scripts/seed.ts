/**
 * Script de seed para Firestore: crea el admin por defecto y denuncias de prueba.
 * Uso local: firebase emulators:start + pnpm db:seed (FIRESTORE_EMULATOR_HOST lo detecta solo).
 * Uso producción: gcloud auth application-default login + pnpm db:seed.
 */
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import bcrypt from "bcrypt";

const REPORTS_COLLECTION = "reports";

async function seed(): Promise<void> {
  console.log("🌱 Sembrando datos de prueba...");

  const projectId = process.env.GCS_PROJECT_ID ?? "villarrica-ciudadano";
  const app = initializeApp({ projectId });
  const db = getFirestore(app);

  // Crear usuario admin por defecto (IDs fijos para que el seed sea idempotente)
  const adminPassword = await bcrypt.hash("admin123", 10);
  await db
    .collection("admin_users")
    .doc("00000000-0000-4000-8000-000000000001")
    .set({
      email: "admin@villarrica.cl",
      password: adminPassword,
      name: "Administrador",
      role: "admin",
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
    });
  console.log("  ✓ Usuario admin creado (admin@villarrica.cl / admin123)");

  // Crear denuncias de prueba en Villarrica
  const testReports = [
    {
      id: "00000000-0000-4000-8000-000000000002",
      description:
        "Luminaria apagada en intersección de Av. Los Laureles con Caupolicán. Lleva 2 semanas sin funcionar.",
      lat: -39.2785,
      lng: -72.2284,
      category: "Luminarias",
    },
    {
      id: "00000000-0000-4000-8000-000000000003",
      description:
        "Bache profundo en calle General Urrutia, peligro para vehículos y ciclistas.",
      lat: -39.2792,
      lng: -72.2271,
      category: "Baches",
    },
    {
      id: "00000000-0000-4000-8000-000000000004",
      description: "Acumulación de basura en esquina de Pedro de Valdivia con Matta.",
      lat: -39.2778,
      lng: -72.2295,
      category: "Aseo",
    },
    {
      id: "00000000-0000-4000-8000-000000000005",
      description:
        "Poca iluminación en pasaje Las Rosas, sensación de inseguridad por las noches.",
      lat: -39.2801,
      lng: -72.226,
      category: "Seguridad",
    },
    {
      id: "00000000-0000-4000-8000-000000000006",
      description:
        "Semáforo intermitente en cruce de Av. Los Laureles con Manuel Rodríguez.",
      lat: -39.277,
      lng: -72.2301,
      category: "Tráfico",
    },
  ];

  for (const report of testReports) {
    await db.collection(REPORTS_COLLECTION).doc(report.id).set({
      description: report.description,
      category: report.category,
      status: "pending",
      location: { lat: report.lat, lng: report.lng },
      imageUrl: null,
      citizenUserId: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`  ✓ ${testReports.length} denuncias de prueba creadas`);

  console.log("✅ Datos de prueba sembrados");
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
