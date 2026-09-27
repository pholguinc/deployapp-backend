import { IsString, IsOptional, IsInt, IsNumber, IsBoolean, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ description: 'Course title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Course description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Course category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Course level (e.g., Beginner, Intermediate)' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ description: 'Estimated duration (e.g., 4h 30m)' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ description: 'Instructor name' })
  @IsOptional()
  @IsString()
  instructor?: string;

  @ApiPropertyOptional({ description: 'URL for course thumbnail/image' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ default: true, description: 'Is course active?' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Course features or benefits', type: [String] })
  @IsOptional()
  @IsString({ each: true })
  features?: string[];
}
