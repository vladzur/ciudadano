import { IsEmail, IsString, MinLength } from "class-validator";

/** DTO para login de administrador */
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
