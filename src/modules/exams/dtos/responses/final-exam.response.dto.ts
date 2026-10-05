import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FinalExamOptionResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'NestJS' })
  text: string;

  @ApiPropertyOptional({ example: true })
  isCorrect?: boolean;
}

export class FinalExamQuestionResponseDto {
  @ApiProperty({ example: 'q1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: '¿Qué framework de backend usa este proyecto?' })
  text: string;

  @ApiProperty({ type: [FinalExamOptionResponseDto] })
  options: FinalExamOptionResponseDto[];
}

export class FinalExamResponseDto {
  @ApiProperty({ example: 'ex1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'c1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  courseId: string;

  @ApiProperty({ example: 'Examen Final de Certificación' })
  title: string;

  @ApiProperty({ type: [FinalExamQuestionResponseDto] })
  questions: FinalExamQuestionResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
