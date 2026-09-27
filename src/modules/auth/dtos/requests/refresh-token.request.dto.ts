import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'El refreshToken debe ser un string' })
  @IsNotEmpty({ message: 'El refreshToken es requerido' })
  refreshToken: string;
}
