import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SettingsService } from '../services/settings.service';
import { UpsertSettingDto } from '../dtos/upsert-setting.dto';

@ApiTags('Settings')
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
