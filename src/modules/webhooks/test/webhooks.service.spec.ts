import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WebhooksService } from '../services/webhooks.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CourseCompletedWebhookDto } from '../dtos/course-completed-webhook.dto';

const dto = {
  event: 'course.completed',
  userId: 'client-user',
  courseId: 'course-1',
  studentName: 'Nombre enviado por el cliente',
  score: 20,
} as CourseCompletedWebhookDto;

const certificate = {
  id: 'cert-1',
  userId: 'student-1',
  courseId: 'course-1',
  score: 17.5,
  issuedAt: new Date('2026-05-04T00:00:00Z'),
};

describe('WebhooksService', () => {
  let service: WebhooksService;
  let notificationsService: { createCourseCompletedNotification: jest.Mock };
  let prisma: {
    certificate: { findUnique: jest.Mock };
    notification: { findFirst: jest.Mock };
  };

  beforeEach(async () => {
    notificationsService = {
      createCourseCompletedNotification: jest
        .fn()
        .mockResolvedValue({ id: 'notif-1' }),
    };
    prisma = {
      certificate: { findUnique: jest.fn() },
      notification: { findFirst: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: NotificationsService, useValue: notificationsService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    jest.spyOn(service['logger'], 'log').mockImplementation(() => undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it.each(['ADMIN', 'SUPERADMIN'])(
    'should let %s create a notification with the data sent',
    async (role) => {
      const result = await service.handleCourseCompleted(dto, {
        id: 'admin-1',
        role,
      });

      expect(prisma.certificate.findUnique).not.toHaveBeenCalled();
      expect(
        notificationsService.createCourseCompletedNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'client-user',
          studentName: 'Nombre enviado por el cliente',
          score: 20,
        }),
      );
      expect(result).toMatchObject({
        received: true,
        event: 'course.completed',
        notificationId: 'notif-1',
      });
    },
  );

  it('should reject a student without a certificate', async () => {
    prisma.certificate.findUnique.mockResolvedValue(null);

    await expect(
      service.handleCourseCompleted(dto, { id: 'student-1', role: 'USER' }),
    ).rejects.toThrow(BadRequestException);
    expect(
      notificationsService.createCourseCompletedNotification,
    ).not.toHaveBeenCalled();
  });

  it('should look up the certificate of the requester, not the userId sent', async () => {
    prisma.certificate.findUnique.mockResolvedValue(certificate);
    prisma.notification.findFirst.mockResolvedValue(null);

    await service.handleCourseCompleted(dto, { id: 'student-1', role: 'USER' });

    expect(prisma.certificate.findUnique).toHaveBeenCalledWith({
      where: {
        userId_courseId: { userId: 'student-1', courseId: 'course-1' },
      },
    });
  });

  it('should return the existing notification instead of duplicating it', async () => {
    prisma.certificate.findUnique.mockResolvedValue(certificate);
    prisma.notification.findFirst.mockResolvedValue({ id: 'existing-notif' });

    const result = await service.handleCourseCompleted(dto, {
      id: 'student-1',
      role: 'USER',
    });

    expect(result.notificationId).toBe('existing-notif');
    expect(
      notificationsService.createCourseCompletedNotification,
    ).not.toHaveBeenCalled();
  });

  it('should create the notification with the certificate data', async () => {
    prisma.certificate.findUnique.mockResolvedValue(certificate);
    prisma.notification.findFirst.mockResolvedValue(null);

    const result = await service.handleCourseCompleted(dto, {
      id: 'student-1',
    });

    expect(
      notificationsService.createCourseCompletedNotification,
    ).toHaveBeenCalledWith({
      userId: 'student-1',
      courseId: 'course-1',
      score: 17.5,
      certificateId: 'cert-1',
      completedAt: '2026-05-04T00:00:00.000Z',
    });
    expect(result.notificationId).toBe('notif-1');
  });

  it('should default the event name when it is not sent', async () => {
    const result = await service.handleCourseCompleted(
      { ...dto, event: undefined },
      { id: 'admin-1', role: 'ADMIN' },
    );

    expect(result.event).toBe('course.completed');
  });
});
