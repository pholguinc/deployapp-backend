import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsRepository, NotificationEntity } from '../repositories/notifications.repository';
import { CreateNotificationDto } from '../dtos/create-notification.dto';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateNotificationDto): Promise<NotificationEntity> {
    return this.notificationsRepository.create(dto);
  }

  async createCourseCompletedNotification(data: {
    userId: string;
    courseId: string;
    studentName?: string;
    studentEmail?: string;
    courseTitle?: string;
    score?: number;
    certificateId?: string;
    completedAt?: string;
    metadata?: Record<string, any>;
  }): Promise<NotificationEntity> {
    let studentName = data.studentName;
    let studentEmail = data.studentEmail;
    let courseTitle = data.courseTitle;

    // Obtener datos del usuario si no fueron pasados
    if (!studentName || !studentEmail) {
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
        select: { name: true, lastname: true, email: true },
      });
      if (user) {
        studentName =
          studentName ||
          `${user.name || ''} ${user.lastname || ''}`.trim() ||
          user.email;
        studentEmail = studentEmail || user.email;
      }
    }

    // Obtener título del curso si no fue pasado
    if (!courseTitle) {
      const course = await this.prisma.course.findUnique({
        where: { id: data.courseId },
        select: { title: true },
      });
      if (course) {
        courseTitle = course.title;
      }
    }

    studentName = studentName || 'Estudiante';
    courseTitle = courseTitle || 'Curso';

    const completedDate = data.completedAt || new Date().toISOString();
    const scoreText = data.score !== undefined ? ` con calificación de ${data.score}/20` : '';

    const title = 'Curso finalizado';
    const message = `El estudiante ${studentName} ha completado exitosamente el curso "${courseTitle}"${scoreText}.`;

    return this.notificationsRepository.create({
      userId: data.userId,
      type: 'COURSE_COMPLETED',
      title,
      message,
      data: {
        userId: data.userId,
        courseId: data.courseId,
        studentName,
        studentEmail,
        courseTitle,
        score: data.score,
        certificateId: data.certificateId,
        completedAt: completedDate,
        ...(data.metadata || {}),
      },
      read: false,
    });
  }

  async getAll(limit?: number, unreadOnly?: boolean) {
    const [notifications, unreadCount, total] = await Promise.all([
      this.notificationsRepository.findMany({ limit, unreadOnly }),
      this.notificationsRepository.countUnread(),
      this.notificationsRepository.countTotal(),
    ]);

    return {
      notifications,
      unreadCount,
      total,
    };
  }

  async getById(id: string): Promise<NotificationEntity> {
    const notification = await this.notificationsRepository.findById(id);
    if (!notification) {
      throw new NotFoundException(`Notificación con ID ${id} no encontrada`);
    }
    return notification;
  }

  async markAsRead(id: string): Promise<NotificationEntity> {
    const updated = await this.notificationsRepository.markAsRead(id);
    if (!updated) {
      throw new NotFoundException(`Notificación con ID ${id} no encontrada`);
    }
    return updated;
  }

  async markAllAsRead(): Promise<{ updatedCount: number }> {
    const updatedCount = await this.notificationsRepository.markAllAsRead();
    return { updatedCount };
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const success = await this.notificationsRepository.delete(id);
    if (!success) {
      throw new NotFoundException(`Notificación con ID ${id} no encontrada`);
    }
    return { success: true };
  }
}
