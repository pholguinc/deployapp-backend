import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateResourceDto {
  @ApiProperty({ description: 'Resource name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    default: 'PDF',
    description: 'Resource type (PDF, DOC, IMAGE, etc.)',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'ID of the lesson this resource belongs to' })
  @IsUUID()
  lessonId: string;
}
