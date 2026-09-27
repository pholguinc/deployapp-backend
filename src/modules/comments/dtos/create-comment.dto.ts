import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment text content' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ description: 'ID of the lesson being commented on' })
  @IsUUID()
  lessonId: string;
}
