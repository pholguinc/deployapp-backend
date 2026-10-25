import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import type { RequestUser } from 'src/common/interfaces/request-user.interface';
import { IndicatorsService } from '../services/indicators.service';

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
      'Reporte de los 3 indicadores calculado con las evaluaciones de la app',
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
}
