import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CertificateResponseDto } from './certificate.response.dto';

export class FinalExamAttemptResponseDto {
  @ApiProperty({ example: 'att-1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  userId: string;

  @ApiProperty({ example: 'ex1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  examId: string;

  @ApiProperty({ example: 18.0, description: 'Nota calculada sobre 20' })
  score: number;

  @ApiProperty({ example: 10, description: 'Total de preguntas del examen' })
  total: number;

  @ApiProperty({ example: true, description: 'True si la nota es >= 15' })
  passed: boolean;

  @ApiProperty()
  createdAt: Date;
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
