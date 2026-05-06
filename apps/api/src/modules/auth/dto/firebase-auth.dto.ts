import { IsString } from "class-validator";

/** DTO para autenticación de ciudadano vía token Firebase */
export class FirebaseAuthDto {
  @IsString()
  idToken: string;
}
