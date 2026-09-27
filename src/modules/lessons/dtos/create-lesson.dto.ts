import { IsString, IsInt, Min, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({ description: 'Lesson title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Duration e.g., 08:35 min' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ description: 'Video URL' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({
    default: 'VIDEO',
    description: 'Lesson type (VIDEO, QUIZ, TEXT)',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ default: 0, description: 'Order in the module' })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ description: 'ID of the module this lesson belongs to' })
  @IsUUID()
  moduleId: string;
}
