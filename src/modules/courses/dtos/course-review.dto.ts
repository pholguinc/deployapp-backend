import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseReviewDto {
  @ApiProperty({ example: 5, description: 'Rating from 1 to 5' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @ApiProperty({
    example: 'Excelente curso, muy recomendado',
    description: 'Optional text review',
    required: false,
  })
  @IsString()
  @IsOptional()
  comment?: string;
}
