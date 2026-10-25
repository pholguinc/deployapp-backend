import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from '../services/reports.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: {
    user: { count: jest.Mock };
    course: { count: jest.Mock; findMany: jest.Mock };
    userCourse: { count: jest.Mock; findMany: jest.Mock };
    userLesson: { count: jest.Mock };
    certificate: { count: jest.Mock; findMany: jest.Mock };
    finalExamAttempt: { count: jest.Mock; findMany: jest.Mock };
    finalExam: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: { count: jest.fn() },
      course: { count: jest.fn(), findMany: jest.fn() },
      userCourse: { count: jest.fn(), findMany: jest.fn() },
      userLesson: { count: jest.fn() },
      certificate: { count: jest.fn(), findMany: jest.fn() },
      finalExamAttempt: { count: jest.fn(), findMany: jest.fn() },
      finalExam: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSummary', () => {
    it('should compute the completion and pass rates', async () => {
      prisma.user.count.mockResolvedValueOnce(10).mockResolvedValueOnce(8);
      prisma.course.count.mockResolvedValue(3);
      prisma.userCourse.count.mockResolvedValueOnce(9).mockResolvedValueOnce(3);
      prisma.certificate.count.mockResolvedValue(2);
      prisma.finalExamAttempt.count
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1);

      const summary = await service.getSummary();

      expect(summary).toEqual({
        totalUsers: 10,
        activeUsers: 8,
        totalCourses: 3,
        totalEnrollments: 9,
        completedEnrollments: 3,
        completionRate: 33,
        totalCertificates: 2,
        totalAttempts: 4,
        passedAttempts: 3,
        passRate: 75,
        pendingPracticalReviews: 1,
      });
    });

    it('should return 0% rates when there is no data', async () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.course.count.mockResolvedValue(0);
      prisma.userCourse.count.mockResolvedValue(0);
      prisma.certificate.count.mockResolvedValue(0);
      prisma.finalExamAttempt.count.mockResolvedValue(0);

      const summary = await service.getSummary();

      expect(summary.completionRate).toBe(0);
      expect(summary.passRate).toBe(0);
    });
  });

  describe('getCoursesReport', () => {
    it('should aggregate enrollments, progress and ratings per course', async () => {
      prisma.course.findMany.mockResolvedValue([
        {
          id: 'course-1',
          title: 'Docker',
          category: null,
          level: null,
          rating: 0,
          isActive: true,
          instructor: {
            id: 'i1',
            name: 'Eva',
            lastname: 'Soto',
            email: 'eva@mail.com',
          },
          users: [
            { status: 'COMPLETED', progress: 100 },
            { status: 'ENROLLED', progress: 50 },
            { status: 'ENROLLED', progress: 0 },
          ],
          reviews: [{ rating: 5 }, { rating: 4 }],
          certificates: [{ id: 'c1' }],
        },
      ]);

      const [course] = await service.getCoursesReport();

      expect(course).toEqual({
        id: 'course-1',
        title: 'Docker',
        category: 'General',
        level: 'Todos',
        instructor: 'Eva Soto',
        enrolled: 3,
        completed: 1,
        completionRate: 33,
        avgProgress: 50,
        certificatesIssued: 1,
        avgRating: 4.5,
        totalReviews: 2,
        isActive: true,
      });
    });

    it('should handle courses without instructor, students or reviews', async () => {
      prisma.course.findMany.mockResolvedValue([
        {
          id: 'course-2',
          title: 'K8s',
          category: 'DevOps',
          level: 'Avanzado',
          rating: 3.8,
          isActive: false,
          instructor: null,
          users: [],
          reviews: [],
          certificates: [],
        },
      ]);

      const [course] = await service.getCoursesReport();

      expect(course).toMatchObject({
        instructor: 'Sin asignar',
        enrolled: 0,
        completionRate: 0,
        avgProgress: 0,
        avgRating: 3.8,
      });
    });

    it('should show the instructor email when there is no name', async () => {
      prisma.course.findMany.mockResolvedValue([
        {
          id: 'course-3',
          title: 'CI/CD',
          rating: 0,
          instructor: {
            id: 'i2',
            name: null,
            lastname: null,
            email: 'doc@mail.com',
          },
          users: [],
          reviews: [],
          certificates: [],
        },
      ]);

      const [course] = await service.getCoursesReport();

      expect(course.instructor).toBe('doc@mail.com');
    });
  });

  describe('getExamsReport', () => {
    it('should compute pass rate, averages and the IND-01 correct rate', async () => {
      prisma.finalExam.findMany.mockResolvedValue([
        {
          id: 'exam-1',
          title: 'Final',
          course: { id: 'course-1', title: 'Docker' },
          attempts: [
            {
              score: 18,
              passed: true,
              theoreticalCorrect: 9,
              theoreticalTotal: 10,
              practicalScore: 17,
              practicalStatus: 'GRADED',
            },
            {
              score: 10,
              passed: false,
              theoreticalCorrect: 3,
              theoreticalTotal: 10,
              practicalScore: null,
              practicalStatus: 'PENDING_REVIEW',
            },
            {
              score: 0,
              passed: false,
              theoreticalCorrect: null,
              theoreticalTotal: null,
              practicalScore: null,
              practicalStatus: 'NOT_SUBMITTED',
            },
          ],
        },
      ]);

      const [exam] = await service.getExamsReport();

      expect(exam).toEqual({
        id: 'exam-1',
        title: 'Final',
        courseId: 'course-1',
        courseTitle: 'Docker',
        totalAttempts: 3,
        passedAttempts: 1,
        failedAttempts: 2,
        passRate: 33,
        avgScore: 9.3,
        theoreticalCorrectRate: 60,
        avgPracticalScore: 17,
        gradedPracticals: 1,
        pendingReviews: 1,
      });
    });

    it('should return null averages for an exam without attempts', async () => {
      prisma.finalExam.findMany.mockResolvedValue([
        {
          id: 'exam-2',
          title: 'Vacío',
          course: { id: 'course-2', title: 'K8s' },
          attempts: [],
        },
      ]);

      const [exam] = await service.getExamsReport();

      expect(exam).toMatchObject({
        passRate: 0,
        avgScore: 0,
        theoreticalCorrectRate: null,
        avgPracticalScore: null,
      });
    });
  });

  describe('getCertificatesReport', () => {
    it('should map each certificate with the student name', async () => {
      const issuedAt = new Date('2026-05-04');
      prisma.certificate.findMany.mockResolvedValue([
        {
          id: 'cert-1',
          score: 17,
          issuedAt,
          user: {
            id: 'u1',
            name: 'Ana',
            lastname: null,
            email: 'ana@mail.com',
          },
          course: { id: 'course-1', title: 'Docker', category: 'DevOps' },
        },
        {
          id: 'cert-2',
          score: 16,
          issuedAt,
          user: { id: 'u2', name: null, lastname: null, email: 'x@mail.com' },
          course: { id: 'course-1', title: 'Docker', category: 'DevOps' },
        },
      ]);

      const [first, second] = await service.getCertificatesReport();

      expect(first).toEqual({
        id: 'cert-1',
        studentId: 'u1',
        studentName: 'Ana',
        studentEmail: 'ana@mail.com',
        courseId: 'course-1',
        courseTitle: 'Docker',
        courseCategory: 'DevOps',
        score: 17,
        issuedAt,
      });
      expect(second.studentName).toBe('Sin nombre');
    });
  });

  describe('getStudentsProgressReport', () => {
    it('should build a composite id per enrollment', async () => {
      const createdAt = new Date('2026-05-01');
      const updatedAt = new Date('2026-05-02');
      prisma.userCourse.findMany.mockResolvedValue([
        {
          userId: 'u1',
          courseId: 'course-1',
          progress: 40,
          status: 'ENROLLED',
          createdAt,
          updatedAt,
          user: {
            id: 'u1',
            name: 'Ana',
            lastname: 'Pérez',
            email: 'ana@mail.com',
          },
          course: { id: 'course-1', title: 'Docker' },
        },
      ]);

      const [row] = await service.getStudentsProgressReport();

      expect(row).toEqual({
        id: 'u1-course-1',
        userId: 'u1',
        studentName: 'Ana Pérez',
        studentEmail: 'ana@mail.com',
        courseId: 'course-1',
        courseTitle: 'Docker',
        progress: 40,
        status: 'ENROLLED',
        enrolledAt: createdAt,
        updatedAt,
      });
    });
  });

  describe('getMySummary', () => {
    it('should summarise the progress of the student', async () => {
      prisma.userCourse.findMany.mockResolvedValue([
        { status: 'COMPLETED', progress: 100 },
        { status: 'ENROLLED', progress: 25 },
      ]);
      prisma.userLesson.count.mockResolvedValue(12);
      prisma.certificate.count.mockResolvedValue(1);
      prisma.finalExamAttempt.findMany.mockResolvedValue([
        { score: 18, passed: true, practicalStatus: 'GRADED' },
        { score: 11, passed: false, practicalStatus: 'PENDING_REVIEW' },
      ]);

      const summary = await service.getMySummary('u1');

      expect(prisma.userCourse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1' } }),
      );
      expect(summary).toEqual({
        enrolledCourses: 2,
        completedCourses: 1,
        avgProgress: 63,
        completedLessons: 12,
        certificates: 1,
        examAttempts: 2,
        passedExams: 1,
        pendingPracticalReviews: 1,
        avgExamScore: 14.5,
      });
    });

    it('should return a null exam average when there are no attempts', async () => {
      prisma.userCourse.findMany.mockResolvedValue([]);
      prisma.userLesson.count.mockResolvedValue(0);
      prisma.certificate.count.mockResolvedValue(0);
      prisma.finalExamAttempt.findMany.mockResolvedValue([]);

      const summary = await service.getMySummary('u1');

      expect(summary.avgProgress).toBe(0);
      expect(summary.avgExamScore).toBeNull();
    });
  });
});
