import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CourseCompletedWebhookDto {
  @ApiPropertyOptional({
    description: 'Tipo de evento de webhook',
    default: 'course.completed',
  })
  @IsOptional()
  @IsString()
  event?: string;

  @ApiProperty({ description: 'ID del curso completado' })
  @IsNotEmpty()
  @IsString()
  courseId: string;

  @ApiProperty({ description: 'ID del usuario / estudiante' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Nombre completo del estudiante' })
  @IsOptional()
  @IsString()
  studentName?: string;

  @ApiPropertyOptional({ description: 'Correo del estudiante' })
  @IsOptional()
  @IsString()
  studentEmail?: string;

  @ApiPropertyOptional({ description: 'Título del curso' })
  @IsOptional()
  @IsString()
  courseTitle?: string;

  @ApiPropertyOptional({ description: 'Nota final obtenida en el examen' })
  @IsOptional()
  @IsNumber()
  score?: number;

  @ApiPropertyOptional({ description: 'ID del certificado emitido' })
  @IsOptional()
  @IsString()
  certificateId?: string;

  @ApiPropertyOptional({ description: 'Fecha ISO de finalización' })
  @IsOptional()
  @IsString()
  completedAt?: string;

  @ApiPropertyOptional({ description: 'Datos adicionales de contexto' })
  @IsOptional()
  metadata?: Record<string, any>;
}
