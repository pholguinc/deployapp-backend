import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOptionDto {
  @ApiProperty({ description: 'Option text' })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Is this the correct answer?',
  })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;
}

export class CreateQuestionDto {
  @ApiProperty({ description: 'Question text' })
  @IsString()
  text: string;

  @ApiProperty({
    description: 'List of answer options',
    type: [CreateOptionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options: CreateOptionDto[];
}

export class CreateQuizDto {
  @ApiProperty({ description: 'Quiz title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'ID of the lesson this quiz belongs to' })
  @IsOptional()
  @IsUUID()
  lessonId: string;

  @ApiPropertyOptional({
    description: 'List of questions with options',
    type: [CreateQuestionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions?: CreateQuestionDto[];
}
