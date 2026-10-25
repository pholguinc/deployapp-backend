import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: Record<
    | 'create'
    | 'findMany'
    | 'countUnread'
    | 'countTotal'
    | 'findById'
    | 'markAsRead'
    | 'markAllAsRead'
    | 'delete',
    jest.Mock
  >;
  let prisma: {
    user: { findUnique: jest.Mock };
    course: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn().mockImplementation((data) => Promise.resolve(data)),
      findMany: jest.fn(),
      countUnread: jest.fn(),
      countTotal: jest.fn(),
      findById: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      delete: jest.fn(),
    };
    prisma = {
      user: { findUnique: jest.fn() },
      course: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationsRepository, useValue: repository },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCourseCompletedNotification', () => {
    it('should use the data provided without querying the database', async () => {
      await service.createCourseCompletedNotification({
        userId: 'user-1',
        courseId: 'course-1',
        studentName: 'Ana Pérez',
        studentEmail: 'ana@mail.com',
        courseTitle: 'Docker',
        score: 18,
        completedAt: '2026-05-04T00:00:00.000Z',
      });

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.course.findUnique).not.toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          type: 'COURSE_COMPLETED',
          title: 'Curso finalizado',
          message:
            'El estudiante Ana Pérez ha completado exitosamente el curso "Docker" con calificación de 18/20.',
          read: false,
          data: expect.objectContaining({
            courseId: 'course-1',
            studentEmail: 'ana@mail.com',
            completedAt: '2026-05-04T00:00:00.000Z',
          }),
        }),
      );
    });

    it('should load the student and course from the database when missing', async () => {
      prisma.user.findUnique.mockResolvedValue({
        name: 'Luis',
        lastname: 'Rojas',
        email: 'luis@mail.com',
      });
      prisma.course.findUnique.mockResolvedValue({ title: 'Kubernetes' });

      const result = await service.createCourseCompletedNotification({
        userId: 'user-2',
        courseId: 'course-2',
      });

      expect(result.message).toBe(
        'El estudiante Luis Rojas ha completado exitosamente el curso "Kubernetes".',
      );
      expect(result.data).toMatchObject({
        studentName: 'Luis Rojas',
        studentEmail: 'luis@mail.com',
        courseTitle: 'Kubernetes',
      });
    });

    it('should fall back to the email when the user has no name', async () => {
      prisma.user.findUnique.mockResolvedValue({
        name: null,
        lastname: null,
        email: 'sin-nombre@mail.com',
      });
      prisma.course.findUnique.mockResolvedValue({ title: 'Docker' });

      const result = await service.createCourseCompletedNotification({
        userId: 'user-3',
        courseId: 'course-1',
      });

      expect(result.data).toMatchObject({ studentName: 'sin-nombre@mail.com' });
    });

    it('should use generic names when the user and course are not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.course.findUnique.mockResolvedValue(null);

      const result = await service.createCourseCompletedNotification({
        userId: 'ghost',
        courseId: 'ghost-course',
      });

      expect(result.message).toBe(
        'El estudiante Estudiante ha completado exitosamente el curso "Curso".',
      );
    });

    it('should merge the metadata into the notification data', async () => {
      const result = await service.createCourseCompletedNotification({
        userId: 'user-1',
        courseId: 'course-1',
        studentName: 'Ana',
        studentEmail: 'ana@mail.com',
        courseTitle: 'Docker',
        metadata: { source: 'webhook' },
      });

      expect(result.data).toMatchObject({ source: 'webhook' });
    });
  });

  describe('getAll', () => {
    it('should return the notifications with the counters', async () => {
      repository.findMany.mockResolvedValue([{ id: 'n1' }]);
      repository.countUnread.mockResolvedValue(1);
      repository.countTotal.mockResolvedValue(4);

      const result = await service.getAll(10, true);

      expect(repository.findMany).toHaveBeenCalledWith({
        limit: 10,
        unreadOnly: true,
      });
      expect(result).toEqual({
        notifications: [{ id: 'n1' }],
        unreadCount: 1,
        total: 4,
      });
    });
  });

  describe('getById', () => {
    it('should throw NotFoundException when the notification does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAsRead', () => {
    it('should return the updated notification', async () => {
      repository.markAsRead.mockResolvedValue({ id: 'n1', read: true });

      await expect(service.markAsRead('n1')).resolves.toEqual({
        id: 'n1',
        read: true,
      });
    });

    it('should throw NotFoundException when nothing was updated', async () => {
      repository.markAsRead.mockResolvedValue(null);

      await expect(service.markAsRead('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should return how many notifications were updated', async () => {
      repository.markAllAsRead.mockResolvedValue(7);

      await expect(service.markAllAsRead()).resolves.toEqual({
        updatedCount: 7,
      });
    });
  });

  describe('delete', () => {
    it('should return success when the notification was deleted', async () => {
      repository.delete.mockResolvedValue(true);

      await expect(service.delete('n1')).resolves.toEqual({ success: true });
    });

    it('should throw NotFoundException when nothing was deleted', async () => {
      repository.delete.mockResolvedValue(false);

      await expect(service.delete('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
