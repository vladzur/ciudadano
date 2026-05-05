import "reflect-metadata";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { QueryReportDto } from "./query-report.dto.js";

describe("QueryReportDto", () => {
  it("should pass validation with no params (all optional)", async () => {
    const dto = plainToInstance(QueryReportDto, {});

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it("should pass validation with all valid params", async () => {
    const dto = plainToInstance(QueryReportDto, {
      page: 1,
      limit: 20,
      status: "pending",
      category: "Baches",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it("should fail if page is less than 1", async () => {
    const dto = plainToInstance(QueryReportDto, { page: 0 });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty("min");
  });

  it("should fail if limit is less than 1", async () => {
    const dto = plainToInstance(QueryReportDto, { limit: 0 });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty("min");
  });

  it("should fail if limit exceeds 100", async () => {
    const dto = plainToInstance(QueryReportDto, { limit: 101 });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty("max");
  });

  it("should fail if status is not a valid ReportStatus", async () => {
    const dto = plainToInstance(QueryReportDto, { status: "invalid_status" });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should fail if startDate is not ISO format", async () => {
    const dto = plainToInstance(QueryReportDto, { startDate: "not-a-date" });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should fail if endDate is not ISO format", async () => {
    const dto = plainToInstance(QueryReportDto, { endDate: "01/01/2025" });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should accept valid ReportStatus values", async () => {
    for (const status of ["pending", "in_progress", "resolved"]) {
      const dto = plainToInstance(QueryReportDto, { status });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });

  it("should accept limit = 100 (boundary)", async () => {
    const dto = plainToInstance(QueryReportDto, { limit: 100 });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it("should accept page = 1 (boundary)", async () => {
    const dto = plainToInstance(QueryReportDto, { page: 1 });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
