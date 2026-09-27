import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AchievementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  icon?: string | null;

  @ApiPropertyOptional({ description: 'Color hex del ícono (e.g. #0db7ed)' })
  color?: string | null;

  @ApiProperty()
  estado: boolean;

  @ApiProperty()
  orden: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  createdBy?: string | null;

  @ApiPropertyOptional()
  updatedBy?: string | null;

  constructor(partial: Partial<AchievementResponseDto>) {
    Object.assign(this, partial);
  }
}
