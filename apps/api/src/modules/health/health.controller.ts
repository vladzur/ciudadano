import { Controller, Get } from "@nestjs/common";
import { pool } from "@ciudadano/database";

@Controller("health")
export class HealthController {
  @Get()
  async check() {
    const dbOk = await pool
      .query("SELECT 1")
      .then(() => true)
      .catch(() => false);

    return {
      status: dbOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      db: dbOk,
    };
  }
}
