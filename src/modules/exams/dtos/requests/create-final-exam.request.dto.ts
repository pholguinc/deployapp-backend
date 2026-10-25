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

  @ApiPropertyOptional({ example: 'Caso Práctico de Despliegue de Servicios Web' })
  @IsOptional()
  @IsString()
  practicalTitle?: string;

  @ApiPropertyOptional({ example: 'Realiza el despliegue de la API en Docker y sube el informe técnico en PDF con evidencias y capturas.' })
  @IsOptional()
  @IsString()
  practicalInstructions?: string;

  @ApiPropertyOptional({ example: '1. Configuración de contenedores (5 pts)\n2. Proxy reverso Nginx con SSL (5 pts)\n3. Pipeline CI/CD (5 pts)\n4. Evidencias de ejecución (5 pts)' })
  @IsOptional()
  @IsString()
  practicalRubric?: string;

  @ApiPropertyOptional({ example: 'https://.../guia-laboratorio.pdf' })
  @IsOptional()
  @IsString()
  practicalGuideUrl?: string;

  @ApiPropertyOptional({ example: 'https://.../caso-practico-despliegue.pdf' })
  @IsOptional()
  @IsString()
  practicalPdfUrl?: string;

  @ApiPropertyOptional({ example: 'Caso_Practico_Docker_Nginx.pdf' })
  @IsOptional()
  @IsString()
  practicalPdfName?: string;

  @ApiPropertyOptional({ type: [CreateFinalExamQuestionRequestDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFinalExamQuestionRequestDto)
  questions?: CreateFinalExamQuestionRequestDto[];
}
