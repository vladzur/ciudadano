/** Roles de usuario del backoffice */
export enum UserRole {
  ADMIN = "admin",
  STAFF = "staff",
}

/** Estados de aprobación de usuario backoffice */
export enum AdminUserStatus {
  PENDING = "pending",
  ACTIVE = "active",
  REJECTED = "rejected",
}

/** Interfaz de usuario administrador */
export interface IAdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: AdminUserStatus;
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

/** DTO de registro de usuario backoffice */
export interface RegisterAdminDto {
  email: string;
  password: string;
  name: string;
}

/** DTO para aprobar/rechazar usuario */
export interface UpdateUserStatusDto {
  status: "active" | "rejected";
}

/** DTO para cambiar rol de usuario */
export interface UpdateUserRoleDto {
  role: UserRole;
}

/** Usuario ciudadano vinculado a Firebase Auth */
export interface ICitizenUser {
  id: string;
  firebase_uid: string;
  email: string | null;
  display_name: string | null;
  provider: string;
  created_at: string;
  last_login: string;
}

/** DTO para autenticación de ciudadano vía Firebase */
export interface FirebaseAuthDto {
  idToken: string;
}
