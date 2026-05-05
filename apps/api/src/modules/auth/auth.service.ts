import {
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { pool } from "@ciudadano/database";
import type { LoginDto, LoginResponse, IAdminUser, JwtPayload } from "@ciudadano/shared";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /** Autentica usuario administrador y retorna tokens */
  async login(dto: LoginDto): Promise<LoginResponse> {
    const result = await pool.query(
      `SELECT id, email, password, name, role, created_at
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
      created_at: user.created_at,
    };

    return { accessToken, refreshToken, user: userResponse };
  }

  /** Valida token JWT */
  async validateUser(payload: JwtPayload): Promise<JwtPayload> {
    return payload;
  }
}
