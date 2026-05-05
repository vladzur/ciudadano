import { Module } from "@nestjs/common";
import { ReportsAnalyticsController } from "./reports-analytics.controller.js";
import { ReportsAnalyticsService } from "./reports-analytics.service.js";
import { ReportsModule } from "../reports/reports.module.js";
import { StorageModule } from "../storage/storage.module.js";

@Module({
  imports: [ReportsModule, StorageModule],
  controllers: [ReportsAnalyticsController],
  providers: [ReportsAnalyticsService],
})
export class ReportsAnalyticsModule {}
