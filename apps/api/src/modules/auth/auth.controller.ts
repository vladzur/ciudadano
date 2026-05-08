import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { FirebaseAuthService } from "./firebase-auth.service.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { RolesGuard } from "./roles.guard.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { RegisterAdminDto } from "./dto/register.dto.js";
import { FirebaseAuthDto } from "./dto/firebase-auth.dto.js";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto.js";
import { UpdateUserRoleDto } from "./dto/update-user-role.dto.js";
import type { LoginDto } from "@ciudadano/shared";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly firebaseAuthService: FirebaseAuthService
  ) {}

  /** POST /api/v1/auth/login - Login de administrador */
  @Post("login")
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return { success: true, data };
  }

  /** POST /api/v1/auth/register - Registro de usuario backoffice */
  @Post("register")
  async register(@Body() dto: RegisterAdminDto) {
    const data = await this.authService.register(dto);
    return { success: true, data, message: "Registro exitoso. Espera aprobación del administrador." };
  }

  /** POST /api/v1/auth/citizen - Autenticación de ciudadano vía Firebase */
  @Post("citizen")
  async citizenAuth(@Body() dto: FirebaseAuthDto) {
    const result = await this.firebaseAuthService.verifyCitizenToken(dto.idToken);
    const payload = { sub: result.citizenUser.id, email: result.citizenUser.email ?? "" };
    const accessToken = this.authService.signCitizenToken(payload);
    return { success: true, data: { accessToken, user: result.citizenUser } };
  }

  /** GET /api/v1/auth/users - Listar usuarios (ADMIN) */
  @Get("users")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  async listUsers() {
    const data = await this.authService.findAll();
    return { success: true, data };
  }

  /** PATCH /api/v1/auth/users/:id/status - Aprobar/rechazar usuario (ADMIN) */
  @Patch("users/:id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  async updateUserStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @Request() req: any
  ) {
    const data = await this.authService.updateStatus(id, dto.status, req.user.sub);
    return { success: true, data };
  }

  /** PATCH /api/v1/auth/users/:id/role - Cambiar rol (ADMIN) */
  @Patch("users/:id/role")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  async updateUserRole(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
    @Request() req: any
  ) {
    const data = await this.authService.updateRole(id, dto.role, req.user.sub);
    return { success: true, data };
  }

  /** DELETE /api/v1/auth/users/:id - Eliminar usuario (ADMIN) */
  @Delete("users/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  async deleteUser(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req: any
  ) {
    await this.authService.deleteUser(id, req.user.sub);
    return { success: true, message: "Usuario eliminado." };
  }
}
