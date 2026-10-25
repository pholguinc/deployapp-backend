import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { NotificationsService } from '../services/notifications.service';
import { CreateNotificationDto } from '../dtos/create-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las notificaciones' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Lista de notificaciones con conteo no leído',
  })
  findAll(
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const isUnreadOnly = unreadOnly === 'true';
    return this.notificationsService.getAll(parsedLimit, isUnreadOnly);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una notificación por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de la notificación' })
  findById(@Param('id') id: string) {
    return this.notificationsService.getById(id);
  }

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Crear una notificación manualmente' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Post('test')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({
    summary: 'Crear una notificación de prueba de curso finalizado',
  })
  createTest() {
    return this.notificationsService.createCourseCompletedNotification({
      userId: 'test-user-id',
      courseId: 'test-course-id',
      studentName: 'Estudiante Demo',
      studentEmail: 'alumno.demo@deploylab.io',
      courseTitle: 'Arquitectura Cloud con Kubernetes',
      score: 19.5,
      completedAt: new Date().toISOString(),
    });
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  markAllAsRead() {
    return this.notificationsService.markAllAsRead();
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Delete(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Eliminar una notificación' })
  delete(@Param('id') id: string) {
    return this.notificationsService.delete(id);
  }
}
