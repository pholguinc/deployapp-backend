import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CourseCompletedWebhookDto } from '../dtos/course-completed-webhook.dto';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { PrismaService } from '../../../prisma/prisma.service';

const ADMIN_ROLES = ['SUPERADMIN', 'ADMIN'];

export interface WebhookRequester {
  id: string;
  role?: string;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  async handleCourseCompleted(
    dto: CourseCompletedWebhookDto,
    requester: WebhookRequester,
  ) {
    this.logger.log(
      `Webhook recibido: curso completado [curso: ${dto.courseId}, usuario: ${dto.userId}, solicitante: ${requester.id}]`,
    );

    // Los administradores pueden disparar notificaciones de prueba con datos libres
    if (requester.role && ADMIN_ROLES.includes(requester.role)) {
      const notification =
        await this.notificationsService.createCourseCompletedNotification({
          userId: dto.userId,
          courseId: dto.courseId,
          studentName: dto.studentName,
          studentEmail: dto.studentEmail,
          courseTitle: dto.courseTitle,
          score: dto.score,
          certificateId: dto.certificateId,
          completedAt: dto.completedAt || new Date().toISOString(),
          metadata: dto.metadata,
        });
      return this.toResponse(dto, notification.id, notification);
    }

    // Cualquier otro usuario solo notifica SU curso, y solo si tiene el certificado emitido.
    // Nombre, nota y certificado salen de la base de datos, no del cliente.
    const certificate = await this.prisma.certificate.findUnique({
      where: {
        userId_courseId: { userId: requester.id, courseId: dto.courseId },
      },
    });
    if (!certificate) {
      throw new BadRequestException(
        'El curso aún no tiene un certificado emitido para este usuario.',
      );
    }

    // La emisión del certificado ya genera la notificación: se evita duplicarla
    const existing = await this.prisma.notification.findFirst({
      where: {
        type: 'COURSE_COMPLETED',
        userId: requester.id,
        data: { path: ['courseId'], equals: dto.courseId },
      },
    });
    if (existing) {
      return this.toResponse(dto, existing.id, existing);
    }

    const notification =
      await this.notificationsService.createCourseCompletedNotification({
        userId: requester.id,
        courseId: dto.courseId,
        score: certificate.score,
        certificateId: certificate.id,
        completedAt: certificate.issuedAt.toISOString(),
      });
    return this.toResponse(dto, notification.id, notification);
  }

  private toResponse(
    dto: CourseCompletedWebhookDto,
    notificationId: string,
    notification: unknown,
  ) {
    return {
      received: true,
      event: dto.event || 'course.completed',
      notificationId,
      notification,
    };
  }
}
