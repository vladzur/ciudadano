import { IsString, IsNotEmpty, IsLatitude, IsLongitude, MinLength, MaxLength } from "class-validator";

/** DTO para crear una denuncia ciudadana */
export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;
}
