import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiPropertyOptional({ description: 'ID del usuario destinatario o asociado' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Tipo de notificación', default: 'COURSE_COMPLETED' })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ description: 'Título de la notificación' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Mensaje descriptivo de la notificación' })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Datos adicionales en formato JSON' })
  @IsOptional()
  data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Estado de lectura', default: false })
  @IsOptional()
  @IsBoolean()
  read?: boolean;
}
