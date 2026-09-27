import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class RoleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  name?: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ type: RoleDto })
  role?: RoleDto | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}