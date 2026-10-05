import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from '../services/reports.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Obtener resumen general de métricas' })
  getSummary() {
    return this.reportsService.getSummary();
  }

  @Get('courses')
  @ApiOperation({ summary: 'Obtener reporte detallado por curso' })
  getCoursesReport() {
    return this.reportsService.getCoursesReport();
  }

  @Get('exams')
  @ApiOperation({ summary: 'Obtener reporte de exámenes y notas' })
  getExamsReport() {
    return this.reportsService.getExamsReport();
  }

  @Get('certificates')
  @ApiOperation({ summary: 'Obtener padrón de certificados emitidos' })
  getCertificatesReport() {
    return this.reportsService.getCertificatesReport();
  }

  @Get('students-progress')
  @ApiOperation({ summary: 'Obtener reporte de progreso de estudiantes' })
  getStudentsProgressReport() {
    return this.reportsService.getStudentsProgressReport();
  }
}
