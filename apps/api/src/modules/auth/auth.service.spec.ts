import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";
import { UserRole } from "@ciudadano/shared";
import { AuthService } from "./auth.service.js";
import { pool } from "@ciudadano/database";
import * as bcrypt from "bcrypt";

jest.mock("@ciudadano/database", () => ({
  pool: { query: jest.fn() },
}));

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
}));

describe("AuthService", () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockUser = {
    id: "uuid-1",
    email: "admin@villarrica.cl",
    password: "hashed-password",
    name: "Admin",
    role: "admin",
    created_at: "2025-01-01T00:00:00Z",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { sign: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe("login", () => {
    const loginDto = { email: "admin@villarrica.cl", password: "secret123" };

    it("should return tokens and user when credentials are valid", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce("access-token-xyz")
        .mockReturnValueOnce("refresh-token-xyz");

      const result = await service.login(loginDto);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        [loginDto.email]
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: "access-token-xyz",
        refreshToken: "refresh-token-xyz",
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          created_at: mockUser.created_at,
        },
      });
    });

    it("should throw UnauthorizedException when email is not found", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException when password is incorrect", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("validateUser", () => {
    it("should return the received payload unchanged", async () => {
      const payload = { sub: "uuid-1", email: "admin@test.cl", role: UserRole.ADMIN };
      const result = await service.validateUser(payload);
      expect(result).toEqual(payload);
    });
  });
});
