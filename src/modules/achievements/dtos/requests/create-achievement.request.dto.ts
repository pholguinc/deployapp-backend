import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAchievementRequestDto {
  @ApiProperty({ description: 'Nombre del logro' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Ícono del logro (nombre Lucide)' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Color hex del ícono (e.g. #0db7ed)' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Estado del logro (activo/inactivo)',
  })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;

  @ApiPropertyOptional({ default: 0, description: 'Orden en la lista' })
  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}
