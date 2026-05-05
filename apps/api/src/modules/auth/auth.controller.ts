import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import type { LoginDto } from "@ciudadano/shared";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** POST /api/v1/auth/login - Login de administrador */
  @Post("login")
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return { success: true, data };
  }
}
