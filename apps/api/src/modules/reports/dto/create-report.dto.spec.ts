import "reflect-metadata";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { CreateReportDto } from "./create-report.dto.js";

describe("CreateReportDto", () => {
  it("should pass validation with valid data", async () => {
    const dto = plainToInstance(CreateReportDto, {
      description: "Bache profundo en la calle principal que causa daños a vehículos",
      category: "Baches",
      latitude: -39.2785,
      longitude: -72.2284,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it("should fail if description is shorter than 10 characters", async () => {
    const dto = plainToInstance(CreateReportDto, {
      description: "Corto",
      category: "Baches",
      latitude: -39.2785,
      longitude: -72.2284,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty("minLength");
  });

  it("should fail if description exceeds 2000 characters", async () => {
    const dto = plainToInstance(CreateReportDto, {
      description: "x".repeat(2001),
      category: "Baches",
      latitude: -39.2785,
      longitude: -72.2284,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty("maxLength");
  });

  it("should fail if description is empty", async () => {
    const dto = plainToInstance(CreateReportDto, {
      description: "",
      category: "Baches",
      latitude: -39.2785,
      longitude: -72.2284,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should fail if category is empty", async () => {
    const dto = plainToInstance(CreateReportDto, {
      description: "Descripción válida de bache",
      category: "",
      latitude: -39.2785,
      longitude: -72.2284,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should fail if latitude is out of range", async () => {
    const dto = plainToInstance(CreateReportDto, {
      description: "Descripción válida de bache",
      category: "Baches",
      latitude: 100,
      longitude: -72.2284,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should fail if longitude is out of range", async () => {
    const dto = plainToInstance(CreateReportDto, {
      description: "Descripción válida de bache",
      category: "Baches",
      latitude: -39.2785,
      longitude: 200,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should fail if latitude is not a number", async () => {
    const dto = plainToInstance(CreateReportDto, {
      description: "Descripción válida de bache",
      category: "Baches",
      latitude: "invalid",
      longitude: -72.2284,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
