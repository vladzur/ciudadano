import { IsEmail, IsString, MinLength, MaxLength } from "class-validator";

/** DTO de registro de usuario backoffice */
export class RegisterAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}
