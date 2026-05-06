import { IsIn } from "class-validator";
import { UserRole } from "@ciudadano/shared";

/** DTO para cambiar rol de usuario backoffice */
export class UpdateUserRoleDto {
  @IsIn([UserRole.ADMIN, UserRole.STAFF])
  role: UserRole;
}
