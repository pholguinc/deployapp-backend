import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExamAttemptResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indica si el usuario ya rindió el examen',
  })
  hasAttempted: boolean;

  @ApiPropertyOptional({ example: 'att-1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id?: string;

  @ApiPropertyOptional({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  userId?: string;

  @ApiPropertyOptional({ example: 'ex1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  examId?: string;

  @ApiPropertyOptional({ example: 18.0, description: 'Nota promedio consolidada sobre 20' })
  score?: number;

  @ApiPropertyOptional({ example: 10, description: 'Total de preguntas teóricas' })
  total?: number;

  @ApiPropertyOptional({ example: true, description: 'True si nota final es aprobatoria' })
  passed?: boolean;

  @ApiPropertyOptional({ example: 18.0 })
  theoreticalScore?: number | null;

  @ApiPropertyOptional({ example: 10 })
  theoreticalTotal?: number | null;

  @ApiPropertyOptional({ example: 9 })
  theoreticalCorrect?: number | null;

  @ApiPropertyOptional({ example: true })
  theoreticalPassed?: boolean;

  @ApiPropertyOptional({ example: 'https://storage.../practical.pdf' })
  practicalFileUrl?: string | null;

  @ApiPropertyOptional({ example: 'informe_despliegue.pdf' })
  practicalFileName?: string | null;

  @ApiPropertyOptional()
  practicalSubmittedAt?: Date | null;

  @ApiPropertyOptional({ example: 'PENDING_REVIEW' })
  practicalStatus?: string;

  @ApiPropertyOptional({ example: 16.0 })
  practicalScore?: number | null;

  @ApiPropertyOptional({ example: 'Buen trabajo' })
  practicalFeedback?: string | null;

  @ApiPropertyOptional()
  practicalGradedAt?: Date | null;

  @ApiPropertyOptional({ example: 20, description: 'Tareas de despliegue evaluadas' })
  practicalTasksEvaluated?: number | null;

  @ApiPropertyOptional({ example: 410, description: 'Tiempo total acumulado (min)' })
  practicalTotalMinutes?: number | null;

  @ApiPropertyOptional({ example: 6 })
  incidentsInjected?: number | null;

  @ApiPropertyOptional({ example: 5 })
  incidentsResolved?: number | null;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}
