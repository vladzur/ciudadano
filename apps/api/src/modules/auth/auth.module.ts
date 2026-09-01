import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { FirebaseAuthService } from "./firebase-auth.service.js";
import { AdminUsersRepository } from "./admin-users.repository.js";
import { CitizenUsersRepository } from "./citizen-users.repository.js";
import { JwtStrategy } from "./jwt.strategy.js";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("jwt.secret"),
        signOptions: {
          expiresIn: config.get<string>("jwt.expiration"),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    FirebaseAuthService,
    AdminUsersRepository,
    CitizenUsersRepository,
    JwtStrategy,
  ],
  exports: [AuthService, FirebaseAuthService, JwtModule],
})
export class AuthModule {}
