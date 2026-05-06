import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { pool } from "@ciudadano/database";
import type { LoginDto, LoginResponse, IAdminUser, JwtPayload, RegisterAdminDto, UpdateUserStatusDto, UserRole } from "@ciudadano/shared";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /** Autentica usuario administrador y retorna tokens */
  async login(dto: LoginDto): Promise<LoginResponse> {
    const result = await pool.query(
      `SELECT id, email, password, name, role, status, created_at
       FROM admin_users WHERE email = $1`,
      [dto.email]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException("Credenciales inválidas.");
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Credenciales inválidas.");
    }

    if (user.status !== "active") {
      if (user.status === "pending") {
        throw new UnauthorizedException("Cuenta pendiente de aprobación.");
      }
      throw new UnauthorizedException("Cuenta rechazada.");
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>("jwt.refreshExpiration"),
    });

    const userResponse: IAdminUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
    };

    return { accessToken, refreshToken, user: userResponse };
  }

  /** Registra nuevo usuario backoffice con estado pendiente */
  async register(dto: RegisterAdminDto): Promise<IAdminUser> {
    const existing = await pool.query(
      "SELECT id FROM admin_users WHERE email = $1",
      [dto.email]
    );
    if (existing.rows.length > 0) {
      throw new ConflictException("El email ya está registrado.");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const result = await pool.query(
      `INSERT INTO admin_users (email, password, name, role, status)
       VALUES ($1, $2, $3, 'staff', 'pending')
       RETURNING id, email, name, role, status, created_at`,
      [dto.email, hashedPassword, dto.name]
    );
    return this.mapUser(result.rows[0]);
  }

  /** Lista todos los usuarios del backoffice */
  async findAll(): Promise<IAdminUser[]> {
    const result = await pool.query(
      "SELECT id, email, name, role, status, created_at FROM admin_users ORDER BY created_at DESC"
    );
    return result.rows.map((r) => this.mapUser(r));
  }

  /** Aprueba o rechaza un usuario */
  async updateStatus(userId: string, status: UpdateUserStatusDto["status"], currentUserId: string): Promise<IAdminUser> {
    if (userId === currentUserId) {
      throw new ForbiddenException("No puedes modificar tu propio estado.");
    }
    const result = await pool.query(
      `UPDATE admin_users SET status = $1 WHERE id = $2
       RETURNING id, email, name, role, status, created_at`,
      [status, userId]
    );
    if (result.rows.length === 0) {
      throw new NotFoundException("Usuario no encontrado.");
    }
    return this.mapUser(result.rows[0]);
  }

  /** Cambia el rol de un usuario */
  async updateRole(userId: string, role: UserRole, currentUserId: string): Promise<IAdminUser> {
    if (userId === currentUserId) {
      throw new ForbiddenException("No puedes modificar tu propio rol.");
    }
    const result = await pool.query(
      `UPDATE admin_users SET role = $1 WHERE id = $2
       RETURNING id, email, name, role, status, created_at`,
      [role, userId]
    );
    if (result.rows.length === 0) {
      throw new NotFoundException("Usuario no encontrado.");
    }
    return this.mapUser(result.rows[0]);
  }

  /** Elimina un usuario */
  async deleteUser(userId: string, currentUserId: string): Promise<void> {
    if (userId === currentUserId) {
      throw new ForbiddenException("No puedes eliminar tu propio usuario.");
    }
    const result = await pool.query("DELETE FROM admin_users WHERE id = $1", [userId]);
    if (result.rowCount === 0) {
      throw new NotFoundException("Usuario no encontrado.");
    }
  }

  /** Genera un JWT para ciudadano autenticado vía Firebase */
  signCitizenToken(payload: { sub: string; email: string }): string {
    return this.jwtService.sign({ ...payload, role: "citizen" });
  }

  /** Valida token JWT */
  async validateUser(payload: JwtPayload): Promise<JwtPayload> {
    return payload;
  }

  private mapUser(row: any): IAdminUser {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      status: row.status,
      created_at: row.created_at,
    };
  }
}
