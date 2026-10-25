import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CertificateResponseDto } from './certificate.response.dto';

export class FinalExamAttemptResponseDto {
  @ApiProperty({ example: 'att-1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  userId: string;

  @ApiProperty({ example: 'ex1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  examId: string;

  @ApiProperty({ example: 18.0, description: 'Nota consolidada sobre 20 (promedio teórico + práctico)' })
  score: number;

  @ApiProperty({ example: 10, description: 'Total de preguntas del examen teórico' })
  total: number;

  @ApiProperty({ example: true, description: 'True si el promedio final es aprobatorio' })
  passed: boolean;

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

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}

export class SubmitFinalExamResponseDto {
  @ApiProperty({ example: 18.0, description: 'Nota obtenida sobre 20' })
  score: number;

  @ApiProperty({ example: 10, description: 'Total de preguntas en el examen' })
  total: number;

  @ApiProperty({ example: 9, description: 'Cantidad de respuestas correctas' })
  correct: number;

  @ApiProperty({
    example: true,
    description: 'Aprobado si la nota es mayor o igual a 15',
  })
  passed: boolean;

  @ApiProperty({ type: FinalExamAttemptResponseDto })
  attempt: FinalExamAttemptResponseDto;

  @ApiPropertyOptional({
    type: CertificateResponseDto,
    nullable: true,
    description: 'Certificado generado si el alumno aprobó con nota >= 15',
  })
  certificate: CertificateResponseDto | null;
}
