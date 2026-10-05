import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertSettingDto {
  @ApiProperty({
    description: 'Valor o datos de la configuración en formato JSON',
  })
  @IsNotEmpty()
  value: any;

  @ApiPropertyOptional({
    description: 'Descripción opcional de la configuración',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
