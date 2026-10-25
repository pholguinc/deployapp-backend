import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import type { RequestUser } from 'src/common/interfaces/request-user.interface';
import { IndicatorsService } from '../services/indicators.service';
import {
  CreateIndicatorRecordDto,
  UpdateIndicatorRecordDto,
  UpdateIndicatorSheetDto,
} from '../dtos/indicator.dto';

@ApiTags('Indicators')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('indicators')
export class IndicatorsController {
  constructor(private readonly indicatorsService: IndicatorsService) {}

  @Get()
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({
    summary:
      'Fichas de registro pre/post-test de los 3 indicadores, comparación y métricas de la app',
  })
  getIndicators() {
    return this.indicatorsService.getIndicatorsReport();
  }

  @Get('me')
  @ApiOperation({
    summary:
      'Indicadores del estudiante autenticado calculados con sus evaluaciones',
  })
  getMyIndicators(@Request() req: RequestUser) {
    return this.indicatorsService.getMyIndicators(req.user.id);
  }

  @Patch('records/:id')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar un registro (periodo) de una ficha' })
  updateRecord(@Param('id') id: string, @Body() dto: UpdateIndicatorRecordDto) {
    return this.indicatorsService.updateRecord(id, dto);
  }

  @Delete('records/:id')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Eliminar un registro (periodo) de una ficha' })
  deleteRecord(@Param('id') id: string) {
    return this.indicatorsService.deleteRecord(id);
  }

  @Patch(':code/:testType')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({
    summary: 'Actualizar cabecera de la ficha (empresa, fecha de inicio y fin)',
  })
  updateSheet(
    @Param('code') code: string,
    @Param('testType') testType: string,
    @Body() dto: UpdateIndicatorSheetDto,
  ) {
    return this.indicatorsService.updateSheet(code, testType, dto);
  }

  @Post(':code/:testType/records')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({
    summary: 'Agregar un registro (periodo) a la ficha PRE_TEST o POST_TEST',
  })
  createRecord(
    @Param('code') code: string,
    @Param('testType') testType: string,
    @Body() dto: CreateIndicatorRecordDto,
  ) {
    return this.indicatorsService.createRecord(code, testType, dto);
  }
}
