import { Module } from "@nestjs/common";
import { ReportsController } from "./reports.controller.js";
import { ReportsService } from "./reports.service.js";
import { ReportsRepository } from "./reports.repository.js";
import { StorageModule } from "../storage/storage.module.js";

@Module({
  imports: [StorageModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository],
  exports: [ReportsService, ReportsRepository],
})
export class ReportsModule {}
