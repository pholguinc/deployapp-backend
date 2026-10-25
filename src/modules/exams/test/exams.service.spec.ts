import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import { ExamsService } from '../services/exams.service';
import { ExamsRepository } from '../repositories/exams.repository';
import { CoursesRepository } from '../../courses/repositories/courses.repository';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { UploadService } from '../../upload/upload.service';
import {
  CreateFinalExamRequestDto,
  GradePracticalExamRequestDto,
} from '../dtos';

// Documento PDF falso: todos los métodos encadenables devuelven el propio documento
jest.mock('pdfkit', () =>
  jest.fn().mockImplementation(() => {
    const doc: Record<string | symbol, unknown> = {
      page: { width: 842, height: 595 },
      widthOfString: () => 100,
    };
    const proxy: unknown = new Proxy(doc, {
      get: (target, prop) => (prop in target ? target[prop] : () => proxy),
    });
    return proxy;
  }),
);

const exam = {
  id: 'exam-1',
  courseId: 'course-1',
  questions: [
    {
      id: 'q1',
      text: 'P1',
      options: [
        { id: 'q1-ok', text: 'A', isCorrect: true },
        { id: 'q1-bad', text: 'B', isCorrect: false },
      ],
    },
    {
      id: 'q2',
      text: 'P2',
      options: [
        { id: 'q2-ok', text: 'A', isCorrect: true },
        { id: 'q2-bad', text: 'B', isCorrect: false },
      ],
    },
  ],
};

const options: Record<string, { questionId: string; isCorrect: boolean }> = {
  'q1-ok': { questionId: 'q1', isCorrect: true },
  'q1-bad': { questionId: 'q1', isCorrect: false },
  'q2-ok': { questionId: 'q2', isCorrect: true },
  'q2-bad': { questionId: 'q2', isCorrect: false },
};

const pdfFile = {
  originalname: 'informe.pdf',
  mimetype: 'application/pdf',
} as Express.Multer.File;

describe('ExamsService', () => {
  let service: ExamsService;
  let examsRepository: Record<string, jest.Mock>;
  let coursesRepository: Record<string, jest.Mock>;
  let notificationsService: { createCourseCompletedNotification: jest.Mock };
  let uploadService: { uploadFile: jest.Mock };

  beforeEach(async () => {
    examsRepository = {
      findExamByCourse: jest.fn(),
      findExamById: jest.fn(),
      createExam: jest.fn().mockImplementation((data) => Promise.resolve(data)),
      updateExam: jest.fn(),
      deleteExam: jest.fn(),
      findOptionById: jest
        .fn()
        .mockImplementation((id: string) =>
          Promise.resolve(options[id] ?? null),
        ),
      getLastAttempt: jest.fn().mockResolvedValue(null),
      saveAttempt: jest
        .fn()
        .mockImplementation((data) => Promise.resolve(data)),
      updateAttempt: jest
        .fn()
        .mockImplementation((id, data) => Promise.resolve({ id, ...data })),
      findAttemptById: jest.fn(),
      findAttemptsByCourse: jest.fn(),
      upsertCertificate: jest
        .fn()
        .mockImplementation((userId, courseId, score) =>
          Promise.resolve({ id: 'cert-1', userId, courseId, score }),
        ),
      findCertificate: jest.fn(),
    };
    coursesRepository = {
      findById: jest.fn(),
      getUserCourseProgress: jest.fn(),
      countCourseLessons: jest.fn(),
      markCourseCompleted: jest.fn(),
    };
    notificationsService = {
      createCourseCompletedNotification: jest.fn().mockResolvedValue({}),
    };
    uploadService = {
      uploadFile: jest.fn().mockResolvedValue('https://cdn/file.pdf'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        { provide: ExamsRepository, useValue: examsRepository },
        { provide: CoursesRepository, useValue: coursesRepository },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: UploadService, useValue: uploadService },
      ],
    }).compile();

    service = module.get<ExamsService>(ExamsService);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createExam / upsertExam', () => {
    const dto = {
      title: 'Examen final',
      practicalGuideUrl: 'https://cdn/guia.pdf',
      questions: [{ text: 'P1', options: [{ text: 'A' }] }],
    } as CreateFinalExamRequestDto;

    it.each(['createExam', 'upsertExam'] as const)(
      '%s should throw NotFoundException when the course does not exist',
      async (method) => {
        coursesRepository.findById.mockResolvedValue(null);

        await expect(service[method]('missing', dto)).rejects.toThrow(
          NotFoundException,
        );
      },
    );

    it.each(['createExam', 'upsertExam'] as const)(
      '%s should replace the existing exam and apply defaults',
      async (method) => {
        coursesRepository.findById.mockResolvedValue({ id: 'course-1' });
        examsRepository.findExamByCourse.mockResolvedValue({ id: 'old-exam' });

        await service[method]('course-1', dto);

        expect(examsRepository.deleteExam).toHaveBeenCalledWith('old-exam');
        expect(examsRepository.createExam).toHaveBeenCalledWith({
          title: 'Examen final',
          practicalTitle: 'Caso Práctico de Despliegue de Servicios',
          practicalInstructions: null,
          practicalRubric: null,
          practicalGuideUrl: 'https://cdn/guia.pdf',
          practicalPdfUrl: 'https://cdn/guia.pdf',
          practicalPdfName: null,
          course: { connect: { id: 'course-1' } },
          questions: {
            create: [
              {
                text: 'P1',
                options: { create: [{ text: 'A', isCorrect: false }] },
              },
            ],
          },
        });
      },
    );
  });

  describe('getExamByCourse', () => {
    it('should hide which options are correct', async () => {
      examsRepository.findExamByCourse.mockResolvedValue(exam);

      const result = await service.getExamByCourse('course-1');

      for (const question of result.questions) {
        for (const option of question.options) {
          expect(option).not.toHaveProperty('isCorrect');
        }
      }
    });

    it('should throw NotFoundException when the course has no exam', async () => {
      examsRepository.findExamByCourse.mockResolvedValue(null);

      await expect(service.getExamByCourse('course-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('submitExam', () => {
    const allCorrect = {
      answers: [
        { questionId: 'q1', selectedOptionId: 'q1-ok' },
        { questionId: 'q2', selectedOptionId: 'q2-ok' },
      ],
    };

    beforeEach(() => {
      coursesRepository.getUserCourseProgress.mockResolvedValue({
        status: 'COMPLETED',
        completedLessons: [],
      });
      coursesRepository.countCourseLessons.mockResolvedValue(5);
      examsRepository.findExamByCourse.mockResolvedValue(exam);
    });

    it('should reject a user who is not enrolled', async () => {
      coursesRepository.getUserCourseProgress.mockResolvedValue(null);

      await expect(
        service.submitExam('u1', 'course-1', allCorrect),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject a user who has not completed all lessons', async () => {
      coursesRepository.getUserCourseProgress.mockResolvedValue({
        status: 'ENROLLED',
        completedLessons: [{}, {}],
      });

      await expect(
        service.submitExam('u1', 'course-1', allCorrect),
      ).rejects.toThrow(BadRequestException);
    });

    it('should mark the course completed when all lessons are done', async () => {
      coursesRepository.getUserCourseProgress.mockResolvedValue({
        status: 'ENROLLED',
        completedLessons: [{}, {}, {}, {}, {}],
      });

      await service.submitExam('u1', 'course-1', allCorrect);

      expect(coursesRepository.markCourseCompleted).toHaveBeenCalledWith(
        'u1',
        'course-1',
      );
    });

    it('should reject an exam without questions', async () => {
      examsRepository.findExamByCourse.mockResolvedValue({
        ...exam,
        questions: [],
      });

      await expect(
        service.submitExam('u1', 'course-1', allCorrect),
      ).rejects.toThrow(BadRequestException);
    });

    it('should score only correct options that belong to the question', async () => {
      const result = await service.submitExam('u1', 'course-1', {
        answers: [
          { questionId: 'q1', selectedOptionId: 'q1-ok' },
          // Opción correcta, pero de otra pregunta: no suma
          { questionId: 'q2', selectedOptionId: 'q1-ok' },
        ],
      });

      expect(result.correct).toBe(1);
      expect(result.score).toBe(10);
    });

    it('should save a new attempt but not pass without a graded practical', async () => {
      const result = await service.submitExam('u1', 'course-1', allCorrect);

      expect(examsRepository.saveAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 20,
          total: 2,
          passed: false,
          theoreticalScore: 20,
          theoreticalCorrect: 2,
          theoreticalTotal: 2,
          theoreticalPassed: true,
          practicalStatus: 'NOT_SUBMITTED',
        }),
      );
      expect(result.passed).toBe(false);
      expect(result.certificate).toBeNull();
      expect(examsRepository.upsertCertificate).not.toHaveBeenCalled();
    });

    it('should average with the graded practical and issue the certificate', async () => {
      examsRepository.getLastAttempt.mockResolvedValue({
        id: 'attempt-1',
        practicalStatus: 'GRADED',
        practicalScore: 16,
      });

      const result = await service.submitExam('u1', 'course-1', allCorrect);

      expect(examsRepository.updateAttempt).toHaveBeenCalledWith(
        'attempt-1',
        expect.objectContaining({ score: 18, passed: true }),
      );
      expect(examsRepository.upsertCertificate).toHaveBeenCalledWith(
        'u1',
        'course-1',
        18,
      );
      expect(
        notificationsService.createCourseCompletedNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          score: 18,
          certificateId: 'cert-1',
        }),
      );
      expect(result).toMatchObject({ score: 18, passed: true });
      expect(result.certificate).toMatchObject({ id: 'cert-1' });
    });

    it('should fail when the average is below 15', async () => {
      examsRepository.getLastAttempt.mockResolvedValue({
        id: 'attempt-1',
        practicalStatus: 'GRADED',
        practicalScore: 8,
      });

      const result = await service.submitExam('u1', 'course-1', {
        answers: [{ questionId: 'q1', selectedOptionId: 'q1-ok' }],
      });

      expect(result).toMatchObject({ score: 9, passed: false });
      expect(examsRepository.upsertCertificate).not.toHaveBeenCalled();
    });

    it('should still return the result when the notification fails', async () => {
      examsRepository.getLastAttempt.mockResolvedValue({
        id: 'attempt-1',
        practicalStatus: 'GRADED',
        practicalScore: 20,
      });
      notificationsService.createCourseCompletedNotification.mockRejectedValue(
        new Error('fallo'),
      );

      await expect(
        service.submitExam('u1', 'course-1', allCorrect),
      ).resolves.toMatchObject({ passed: true });
    });
  });

  describe('submitPracticalExam', () => {
    it('should require a file', async () => {
      await expect(
        service.submitPracticalExam(
          'u1',
          'course-1',
          undefined as unknown as Express.Multer.File,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject files that are not PDF', async () => {
      await expect(
        service.submitPracticalExam('u1', 'course-1', {
          originalname: 'foto.png',
          mimetype: 'image/png',
        } as Express.Multer.File),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject a user who is not enrolled', async () => {
      coursesRepository.getUserCourseProgress.mockResolvedValue(null);

      await expect(
        service.submitPracticalExam('u1', 'course-1', pdfFile),
      ).rejects.toThrow(BadRequestException);
      expect(uploadService.uploadFile).not.toHaveBeenCalled();
    });

    it('should create a pending review attempt when there is none', async () => {
      coursesRepository.getUserCourseProgress.mockResolvedValue({});
      examsRepository.findExamByCourse.mockResolvedValue(exam);

      await service.submitPracticalExam('u1', 'course-1', pdfFile);

      expect(uploadService.uploadFile).toHaveBeenCalledWith(
        pdfFile,
        'practical-exams',
      );
      expect(examsRepository.saveAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 0,
          total: 2,
          passed: false,
          practicalFileUrl: 'https://cdn/file.pdf',
          practicalFileName: 'informe.pdf',
          practicalStatus: 'PENDING_REVIEW',
        }),
      );
    });

    it('should update the existing attempt', async () => {
      coursesRepository.getUserCourseProgress.mockResolvedValue({});
      examsRepository.findExamByCourse.mockResolvedValue(exam);
      examsRepository.getLastAttempt.mockResolvedValue({ id: 'attempt-1' });

      await service.submitPracticalExam('u1', 'course-1', pdfFile);

      expect(examsRepository.updateAttempt).toHaveBeenCalledWith(
        'attempt-1',
        expect.objectContaining({ practicalStatus: 'PENDING_REVIEW' }),
      );
      expect(examsRepository.saveAttempt).not.toHaveBeenCalled();
    });
  });

  describe('getPracticalSubmissions', () => {
    it('should compute the final score only for graded attempts', async () => {
      examsRepository.findExamByCourse.mockResolvedValue(exam);
      examsRepository.findAttemptsByCourse.mockResolvedValue([
        {
          id: 'a1',
          theoreticalScore: 18,
          score: 18,
          practicalScore: 14,
          practicalStatus: 'GRADED',
        },
        {
          id: 'a2',
          theoreticalScore: 12,
          score: 12,
          practicalScore: null,
          practicalStatus: 'PENDING_REVIEW',
        },
        {
          id: 'a3',
          theoreticalScore: 10,
          score: 10,
          practicalScore: 12,
          practicalStatus: 'GRADED',
        },
      ]);

      const [graded, pending, failed] =
        await service.getPracticalSubmissions('course-1');

      expect(graded).toMatchObject({ score: 16, passed: true });
      expect(pending).toMatchObject({ score: 12, passed: false });
      expect(failed).toMatchObject({ score: 11, passed: false });
    });
  });

  describe('uploadPracticalGuide', () => {
    it('should save the guide in the exam when it exists', async () => {
      examsRepository.findExamByCourse.mockResolvedValue(exam);

      const result = await service.uploadPracticalGuide('course-1', pdfFile);

      expect(examsRepository.updateExam).toHaveBeenCalledWith('exam-1', {
        practicalGuideUrl: 'https://cdn/file.pdf',
        practicalPdfUrl: 'https://cdn/file.pdf',
        practicalPdfName: 'informe.pdf',
      });
      expect(result).toEqual({
        url: 'https://cdn/file.pdf',
        fileName: 'informe.pdf',
      });
    });
  });

  describe('uploadStudentPracticalFile', () => {
    it('should reject an attempt from another course', async () => {
      examsRepository.findAttemptById.mockResolvedValue({
        id: 'attempt-1',
        exam: { courseId: 'other-course' },
      });

      await expect(
        service.uploadStudentPracticalFile('course-1', 'attempt-1', pdfFile),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('gradePracticalExam', () => {
    const grade = (dto: Partial<GradePracticalExamRequestDto>) =>
      service.gradePracticalExam('course-1', 'attempt-1', 'grader-1', {
        practicalScore: 16,
        ...dto,
      });

    beforeEach(() => {
      examsRepository.findAttemptById.mockResolvedValue({
        id: 'attempt-1',
        userId: 'student-1',
        theoreticalScore: 18,
        score: 18,
        exam: { courseId: 'course-1' },
      });
    });

    it('should reject an attempt that does not exist', async () => {
      examsRepository.findAttemptById.mockResolvedValue(null);

      await expect(grade({})).rejects.toThrow(NotFoundException);
    });

    it('should reject more resolved incidents than injected', async () => {
      await expect(
        grade({ incidentsInjected: 3, incidentsResolved: 4 }),
      ).rejects.toThrow(BadRequestException);
      expect(examsRepository.updateAttempt).not.toHaveBeenCalled();
    });

    it('should save the grade and the indicator metrics and issue the certificate', async () => {
      const result = await grade({
        practicalTasksEvaluated: 2,
        practicalTotalMinutes: 50,
        incidentsInjected: 4,
        incidentsResolved: 3,
        feedback: 'Bien',
      });

      expect(examsRepository.updateAttempt).toHaveBeenCalledWith(
        'attempt-1',
        expect.objectContaining({
          practicalScore: 16,
          practicalTasksEvaluated: 2,
          practicalTotalMinutes: 50,
          incidentsInjected: 4,
          incidentsResolved: 3,
          practicalFeedback: 'Bien',
          practicalStatus: 'GRADED',
          gradedBy: { connect: { id: 'grader-1' } },
          score: 17,
          passed: true,
        }),
      );
      expect(examsRepository.upsertCertificate).toHaveBeenCalledWith(
        'student-1',
        'course-1',
        17,
      );
      expect(result).toMatchObject({
        success: true,
        finalScore: 17,
        passed: true,
      });
    });

    it('should not issue a certificate when the average is below 15', async () => {
      const result = await grade({ practicalScore: 10 });

      expect(result).toMatchObject({ finalScore: 14, passed: false });
      expect(result.certificate).toBeNull();
      expect(examsRepository.upsertCertificate).not.toHaveBeenCalled();
    });
  });

  describe('getLastAttempt', () => {
    beforeEach(() => examsRepository.findExamByCourse.mockResolvedValue(exam));

    it('should report that the user has not attempted the exam', async () => {
      await expect(service.getLastAttempt('u1', 'course-1')).resolves.toEqual({
        hasAttempted: false,
      });
    });

    it('should return the last attempt', async () => {
      examsRepository.getLastAttempt.mockResolvedValue({ id: 'attempt-1' });

      await expect(service.getLastAttempt('u1', 'course-1')).resolves.toEqual({
        hasAttempted: true,
        id: 'attempt-1',
      });
    });
  });

  describe('getCertificate', () => {
    it('should throw NotFoundException when there is no certificate', async () => {
      examsRepository.findCertificate.mockResolvedValue(null);

      await expect(service.getCertificate('u1', 'course-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteExam', () => {
    it('should throw NotFoundException when the exam does not exist', async () => {
      examsRepository.findExamById.mockResolvedValue(null);

      await expect(service.deleteExam('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(examsRepository.deleteExam).not.toHaveBeenCalled();
    });
  });

  describe('generateCertificatePdf', () => {
    const setHeader = jest.fn();
    const buildResponse = () => ({ setHeader }) as unknown as Response;

    it('should throw NotFoundException when there is no certificate', async () => {
      examsRepository.findCertificate.mockResolvedValue(null);

      await expect(
        service.generateCertificatePdf('u1', 'course-1', buildResponse()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should stream the PDF as an attachment', async () => {
      examsRepository.findCertificate.mockResolvedValue({
        score: 17,
        issuedAt: new Date('2026-05-04'),
        user: { name: 'Ana', lastname: 'Pérez' },
        course: { title: 'Docker' },
      });
      const res = buildResponse();

      await service.generateCertificatePdf('u1', 'course-1', res);

      expect(setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="certificado-course-1.pdf"',
      );
      expect(PDFDocument).toHaveBeenCalledWith(
        expect.objectContaining({ size: 'A4', layout: 'landscape' }),
      );
    });
  });
});
