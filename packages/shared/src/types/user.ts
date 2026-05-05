/** Roles de usuario del backoffice */
export enum UserRole {
  ADMIN = "admin",
  STAFF = "staff",
}

/** Interfaz de usuario administrador */
export interface IAdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

/** Payload del JWT */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

/** DTO de login */
export interface LoginDto {
  email: string;
  password: string;
}

/** Respuesta de login exitoso */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: IAdminUser;
}
