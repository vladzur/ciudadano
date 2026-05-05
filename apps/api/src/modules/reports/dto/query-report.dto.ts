import { IsOptional, IsEnum, IsDateString, IsInt, IsString, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { ReportStatus } from "@ciudadano/shared";

/** DTO para filtrar y paginar denuncias */
export class QueryReportDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
