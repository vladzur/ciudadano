import { SetMetadata } from "@nestjs/common";

/** Key usada por RolesGuard para verificar permisos */
export const ROLES_KEY = "roles";

/** Decorador que especifica los roles requeridos para un endpoint */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
