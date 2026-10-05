import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class RoleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  name?: string | null;

  @ApiPropertyOptional()
  lastname?: string | null;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ type: RoleDto })
  role?: RoleDto | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(
    partial: Partial<UserResponseDto> & {
      password?: string;
      roleId?: string | null;
    },
  ) {
    Object.assign(this, partial);
    delete (this as { password?: string }).password;
    delete (this as { roleId?: string | null }).roleId;
  }
}
