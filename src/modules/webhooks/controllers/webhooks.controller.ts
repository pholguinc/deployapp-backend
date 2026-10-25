import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import type { RequestUser } from 'src/common/interfaces/request-user.interface';
import { WebhooksService } from '../services/webhooks.service';
import { CourseCompletedWebhookDto } from '../dtos/course-completed-webhook.dto';

@ApiTags('Webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Verificar estado del servicio de webhooks' })
  health() {
    return { status: 'ok', service: 'webhooks' };
  }

  @Post('course-completed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Notifica que el usuario autenticado finalizó un curso (requiere certificado emitido; los administradores pueden enviar pruebas)',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook procesado y notificación creada con éxito',
  })
  handleCourseCompleted(
    @Request() req: RequestUser,
    @Body() dto: CourseCompletedWebhookDto,
  ) {
    return this.webhooksService.handleCourseCompleted(dto, req.user);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({
    summary:
      'Endpoint genérico de webhooks para múltiples eventos (solo administradores)',
  })
  handleGenericWebhook(@Request() req: RequestUser, @Body() payload: any) {
    // Si viene anidado en payload o directo
    const data: CourseCompletedWebhookDto =
      payload.payload && typeof payload.payload === 'object'
        ? { ...payload.payload, event: payload.event || payload.payload.event }
        : payload;

    return this.webhooksService.handleCourseCompleted(data, req.user);
  }
}
