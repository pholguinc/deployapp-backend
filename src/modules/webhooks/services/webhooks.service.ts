import { Injectable, Logger } from '@nestjs/common';
import { CourseCompletedWebhookDto } from '../dtos/course-completed-webhook.dto';
import { NotificationsService } from '../../notifications/services/notifications.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleCourseCompleted(dto: CourseCompletedWebhookDto) {
    this.logger.log(
      `Webhook recibido: curso completado [curso: ${dto.courseId}, usuario: ${dto.userId}]`,
    );

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

    return {
      received: true,
      event: dto.event || 'course.completed',
      notificationId: notification.id,
      notification,
    };
  }
}
