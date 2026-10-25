import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsString,
} from 'class-validator';

export class GradePracticalExamRequestDto {
  @ApiProperty({
    example: 17,
    description: 'Calificación práctica otorgada por el docente (0 - 20)',
  })
  @IsNumber()
  @Min(0)
  @Max(20)
  practicalScore: number;

  @ApiPropertyOptional({
    example: 'Excelente despliegue con Docker y configuración de SSL.',
    description: 'Feedback u observaciones',
  })
  @IsOptional()
  @IsString()
  feedback?: string;

  // ── Métricas para las fichas de registro (IND-02 e IND-03) ────────────────

  @ApiPropertyOptional({
    example: 20,
    description: 'Tareas de despliegue evaluadas (n)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  practicalTasksEvaluated?: number;

  @ApiPropertyOptional({
    example: 410,
    description: 'Tiempo total acumulado en resolver y desplegar (minutos)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  practicalTotalMinutes?: number;

  @ApiPropertyOptional({
    example: 6,
    description: 'Incidencias inyectadas en el entorno de prueba',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  incidentsInjected?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Incidencias resueltas operativamente',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  incidentsResolved?: number;
}
