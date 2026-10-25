import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import type { RequestUser } from 'src/common/interfaces/request-user.interface';
import { ReportsService } from '../services/reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Obtener resumen general de métricas' })
  getSummary() {
    return this.reportsService.getSummary();
  }

  @Get('courses')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Obtener reporte detallado por curso' })
  getCoursesReport() {
    return this.reportsService.getCoursesReport();
  }

  @Get('exams')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Obtener reporte de exámenes y notas' })
  getExamsReport() {
    return this.reportsService.getExamsReport();
  }

  @Get('certificates')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Obtener padrón de certificados emitidos' })
  getCertificatesReport() {
    return this.reportsService.getCertificatesReport();
  }

  @Get('students-progress')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Obtener reporte de progreso de estudiantes' })
  getStudentsProgressReport() {
    return this.reportsService.getStudentsProgressReport();
  }

  @Get('me')
  @ApiOperation({
    summary: 'Resumen de aprendizaje del usuario autenticado (app móvil)',
  })
  getMySummary(@Request() req: RequestUser) {
    return this.reportsService.getMySummary(req.user.id);
  }
}
