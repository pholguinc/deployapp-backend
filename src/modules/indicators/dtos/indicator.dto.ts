import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';

export class CreateIndicatorRecordDto {
  @ApiPropertyOptional({
    example: 1,
    description:
      'Número de ítem (periodo). Si se omite se asigna el siguiente.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  itemNumber?: number;

  @ApiProperty({
    example: '2025-10-06',
    description: 'Fecha de inicio del periodo de medición',
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    example: '2025-10-20',
    description: 'Fecha de fin del periodo de medición',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'P001-P017', description: 'Grupo evaluado' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiProperty({
    example: 1071,
    description:
      'Numerador: respuestas correctas (IND-01), tiempo total en min (IND-02) o incidencias resueltas (IND-03)',
  })
  @IsNumber()
  @Min(0)
  numerator: number;

  @ApiProperty({
    example: 2550,
    description:
      'Denominador: total de ítems (IND-01), tareas evaluadas (IND-02) o incidencias inyectadas (IND-03)',
  })
  @IsNumber()
  @Min(0.0001)
  denominator: number;

  @ApiPropertyOptional({ example: 'Grupo inicial de practicantes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateIndicatorRecordDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  itemNumber?: number;

  @ApiPropertyOptional({ example: '2025-10-06' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-10-20' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'P001-P017' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ example: 1156 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  numerator?: number;

  @ApiPropertyOptional({ example: 2550 })
  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  denominator?: number;

  @ApiPropertyOptional({ example: 'Actualización tras revisión' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateIndicatorSheetDto {
  @ApiPropertyOptional({ example: 'Native Lab S.A.C.' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ example: '2025-10-06' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-02-26' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
