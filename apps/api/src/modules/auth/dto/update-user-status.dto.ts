import { IsIn } from "class-validator";

/** DTO para aprobar o rechazar usuario backoffice */
export class UpdateUserStatusDto {
  @IsIn(["active", "rejected"])
  status: "active" | "rejected";
}
