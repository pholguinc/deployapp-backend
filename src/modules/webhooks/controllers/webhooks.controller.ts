import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WebhooksService } from '../services/webhooks.service';
import { CourseCompletedWebhookDto } from '../dtos/course-completed-webhook.dto';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get('health')
  @ApiOperation({ summary: 'Verificar estado del servicio de webhooks' })
  health() {
    return { status: 'ok', service: 'webhooks' };
  }

  @Post('course-completed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook disparado cuando un alumno finaliza un curso',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook procesado y notificación creada con éxito',
  })
  handleCourseCompleted(@Body() dto: CourseCompletedWebhookDto) {
    return this.webhooksService.handleCourseCompleted(dto);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Endpoint genérico de webhooks para múltiples eventos',
  })
  handleGenericWebhook(@Body() payload: any) {
    // Si viene anidado en payload o directo
    const data: CourseCompletedWebhookDto =
      payload.payload && typeof payload.payload === 'object'
        ? { ...payload.payload, event: payload.event || payload.payload.event }
        : payload;

    return this.webhooksService.handleCourseCompleted(data);
  }
}
