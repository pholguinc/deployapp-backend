import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFinalExamOptionRequestDto {
  @ApiProperty({ example: 'NestJS' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isCorrect: boolean;
}

export class CreateFinalExamQuestionRequestDto {
  @ApiProperty({ example: '¿Qué framework de backend usa este proyecto?' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ type: [CreateFinalExamOptionRequestDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFinalExamOptionRequestDto)
  options: CreateFinalExamOptionRequestDto[];
}

export class CreateFinalExamRequestDto {
  @ApiProperty({ example: 'Examen Final de Certificación' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ type: [CreateFinalExamQuestionRequestDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFinalExamQuestionRequestDto)
  questions?: CreateFinalExamQuestionRequestDto[];
}
