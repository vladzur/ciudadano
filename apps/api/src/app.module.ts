import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ReportsModule } from "./modules/reports/reports.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { StorageModule } from "./modules/storage/storage.module.js";
import { ReportsAnalyticsModule } from "./modules/reports-analytics/reports-analytics.module.js";
import { HealthModule } from "./modules/health/health.module.js";
import { configuration } from "./config/configuration.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../.env"],
      load: [configuration],
    }),
    ReportsModule,
    AuthModule,
    StorageModule,
    ReportsAnalyticsModule,
    HealthModule,
  ],
})
export class AppModule {}
