import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/** Guard que verifica autenticación JWT */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
