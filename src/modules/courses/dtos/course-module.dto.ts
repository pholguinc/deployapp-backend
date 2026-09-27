import { IsString, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseModuleDto {
  @ApiProperty({ description: 'Module title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ default: 0, description: 'Order in the course' })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateCourseModuleDto {
  @ApiPropertyOptional({ description: 'Module title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Order in the course' })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
