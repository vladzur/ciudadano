import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import type {
  LoginDto,
  LoginResponse,
  IAdminUser,
  JwtPayload,
  RegisterAdminDto,
  UpdateUserStatusDto,
  UserRole,
} from "@ciudadano/shared";
import { AdminUserStatus } from "@ciudadano/shared";
import { AdminUsersRepository } from "./admin-users.repository.js";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly adminUsersRepository: AdminUsersRepository
  ) {}

  /** Autentica usuario administrador y retorna tokens */
  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.adminUsersRepository.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException("Credenciales inválidas.");
    }

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
    if (await this.adminUsersRepository.emailExists(dto.email)) {
      throw new ConflictException("El email ya está registrado.");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.adminUsersRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
    });
  }

  /** Lista todos los usuarios del backoffice */
  async findAll(): Promise<IAdminUser[]> {
    return this.adminUsersRepository.findAll();
  }

  /** Aprueba o rechaza un usuario */
  async updateStatus(
    userId: string,
    status: UpdateUserStatusDto["status"],
    currentUserId: string
  ): Promise<IAdminUser> {
    if (userId === currentUserId) {
      throw new ForbiddenException("No puedes modificar tu propio estado.");
    }
    // Los valores del DTO son un subconjunto del enum AdminUserStatus
    return this.adminUsersRepository.updateStatus(
      userId,
      status as AdminUserStatus
    );
  }

  /** Cambia el rol de un usuario */
  async updateRole(
    userId: string,
    role: UserRole,
    currentUserId: string
  ): Promise<IAdminUser> {
    if (userId === currentUserId) {
      throw new ForbiddenException("No puedes modificar tu propio rol.");
    }
    return this.adminUsersRepository.updateRole(userId, role);
  }

  /** Elimina un usuario */
  async deleteUser(userId: string, currentUserId: string): Promise<void> {
    if (userId === currentUserId) {
      throw new ForbiddenException("No puedes eliminar tu propio usuario.");
    }
    await this.adminUsersRepository.delete(userId);
  }

  /** Genera un JWT para ciudadano autenticado vía Firebase */
  signCitizenToken(payload: { sub: string; email: string }): string {
    return this.jwtService.sign({ ...payload, role: "citizen" });
  }

  /** Valida token JWT */
  async validateUser(payload: JwtPayload): Promise<JwtPayload> {
    return payload;
  }
}
