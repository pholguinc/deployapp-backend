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

  @ApiPropertyOptional({ example: 18.0, description: 'Nota obtenida sobre 20' })
  score?: number;

  @ApiPropertyOptional({ example: 10, description: 'Total de preguntas' })
  total?: number;

  @ApiPropertyOptional({ example: true, description: 'True si nota >= 15' })
  passed?: boolean;

  @ApiPropertyOptional()
  createdAt?: Date;
}
