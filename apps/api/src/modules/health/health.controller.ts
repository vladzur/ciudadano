import { Controller, Get, Inject } from "@nestjs/common";
import type { Firestore } from "firebase-admin/firestore";
import { FIRESTORE } from "../firebase/firebase.constants.js";

@Controller("health")
export class HealthController {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  @Get()
  async check() {
    // Ping ligero a Firestore para verificar conectividad
    const firestoreOk = await this.db
      .collection("reports")
      .limit(1)
      .get()
      .then(() => true)
      .catch(() => false);

    return {
      status: firestoreOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      firestore: firestoreOk,
    };
  }
}
