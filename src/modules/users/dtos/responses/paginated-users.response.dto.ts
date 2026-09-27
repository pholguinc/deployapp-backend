import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user.response.dto';

export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Primera página' })
  firstPage: number;

  @ApiProperty({ example: 10, description: 'Última página' })
  lastPage: number;

  @ApiProperty({ example: 1, description: 'Página actual' })
  currentPage: number;

  @ApiProperty({ example: 10, description: 'Total de páginas' })
  totalPages: number;

  @ApiProperty({ example: 100, description: 'Total de items' })
  totalItems: number;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
