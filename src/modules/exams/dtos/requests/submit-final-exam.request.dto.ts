import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitAnswerRequestDto {
  @ApiProperty({
    description: 'ID de la pregunta',
    example: 'd9b1a5e1-8f52-4e89-a517-8e7c10b78c91',
  })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({
    description: 'ID de la opción seleccionada por el estudiante',
    example: 'e3c4d7b2-3e21-4f12-9c32-1b5e8a7d2c34',
  })
  @IsString()
  @IsNotEmpty()
  selectedOptionId: string;
}

export class SubmitFinalExamRequestDto {
  @ApiProperty({
    type: [SubmitAnswerRequestDto],
    description: 'Lista de respuestas seleccionadas por el alumno',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerRequestDto)
  answers: SubmitAnswerRequestDto[];
}
