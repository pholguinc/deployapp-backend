import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { SettingsService } from '../services/settings.service';
import { UpsertSettingDto } from '../dtos/upsert-setting.dto';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las configuraciones' })
  @ApiResponse({ status: 200, description: 'Lista de configuraciones' })
  findAll() {
    return this.settingsService.getAll();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Obtener una configuración por su clave' })
  @ApiResponse({ status: 200, description: 'Configuración encontrada' })
  findByKey(@Param('key') key: string) {
    return this.settingsService.getByKey(key);
  }

  @Put(':key')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({
    summary: 'Guardar o actualizar una configuración por su clave',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración guardada exitosamente',
  })
  upsert(@Param('key') key: string, @Body() dto: UpsertSettingDto) {
    return this.settingsService.upsert(key, dto);
  }
}
