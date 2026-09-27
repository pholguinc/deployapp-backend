import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiPropertyOptional({ description: 'Comment text content' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  text?: string;

  @ApiPropertyOptional({ description: 'Number of likes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  likes?: number;
}
