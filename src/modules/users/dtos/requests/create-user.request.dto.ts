import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserRequestDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Apellido(s) del usuario' })
  @IsString()
  @IsNotEmpty()
  lastname: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: String, description: 'Role ID' })
  @IsOptional()
  @IsString()
  roleId?: string;
}
