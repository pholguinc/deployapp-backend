import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [
      totalUsers,
      activeUsers,
      totalCourses,
      totalEnrollments,
      completedEnrollments,
      totalCertificates,
      totalAttempts,
      passedAttempts,
      pendingPracticalReviews,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.course.count({ where: { isActive: true } }),
      this.prisma.userCourse.count(),
      this.prisma.userCourse.count({ where: { status: 'COMPLETED' } }),
      this.prisma.certificate.count(),
      this.prisma.finalExamAttempt.count(),
      this.prisma.finalExamAttempt.count({ where: { passed: true } }),
      this.prisma.finalExamAttempt.count({
        where: { practicalStatus: 'PENDING_REVIEW' },
      }),
    ]);

    const completionRate =
      totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0;

    const passRate =
      totalAttempts > 0
        ? Math.round((passedAttempts / totalAttempts) * 100)
        : 0;

    return {
      totalUsers,
      activeUsers,
      totalCourses,
      totalEnrollments,
      completedEnrollments,
      completionRate,
      totalCertificates,
      totalAttempts,
      passedAttempts,
      passRate,
      pendingPracticalReviews,
    };
  }

  async getCoursesReport() {
    const courses = await this.prisma.course.findMany({
      include: {
        instructor: {
          select: { id: true, name: true, lastname: true, email: true },
        },
        users: {
          select: { status: true, progress: true },
        },
        reviews: {
          select: { rating: true },
        },
        certificates: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((c) => {
      const enrolled = c.users.length;
      const completed = c.users.filter((u) => u.status === 'COMPLETED').length;
      const completionRate =
        enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0;
      const avgProgress =
        enrolled > 0
          ? Math.round(
              c.users.reduce((acc, curr) => acc + (curr.progress || 0), 0) /
                enrolled,
            )
          : 0;

      const totalReviews = c.reviews.length;
      const avgRating =
        totalReviews > 0
          ? Number(
              (
                c.reviews.reduce((acc, curr) => acc + curr.rating, 0) /
                totalReviews
              ).toFixed(1),
            )
          : c.rating || 0;

      const instructorName = c.instructor
        ? [c.instructor.name, c.instructor.lastname]
            .filter(Boolean)
            .join(' ') || c.instructor.email
        : 'Sin asignar';

      return {
        id: c.id,
        title: c.title,
        category: c.category || 'General',
        level: c.level || 'Todos',
        instructor: instructorName,
        enrolled,
        completed,
        completionRate,
        avgProgress,
        certificatesIssued: c.certificates.length,
        avgRating,
        totalReviews,
        isActive: c.isActive,
      };
    });
  }

  async getExamsReport() {
    const exams = await this.prisma.finalExam.findMany({
      include: {
        course: {
          select: { id: true, title: true },
        },
        attempts: {
          select: {
            score: true,
            total: true,
            passed: true,
            createdAt: true,
            theoreticalCorrect: true,
            theoreticalTotal: true,
            practicalScore: true,
            practicalStatus: true,
          },
        },
      },
    });

    return exams.map((e) => {
      const totalAttempts = e.attempts.length;
      const passedAttempts = e.attempts.filter((a) => a.passed).length;
      const failedAttempts = totalAttempts - passedAttempts;
      const passRate =
        totalAttempts > 0
          ? Math.round((passedAttempts / totalAttempts) * 100)
          : 0;

      const avgScore =
        totalAttempts > 0
          ? Number(
              (
                e.attempts.reduce((acc, curr) => acc + curr.score, 0) /
                totalAttempts
              ).toFixed(1),
            )
          : 0;

      // Porcentaje de respuestas correctas (misma fórmula que IND-01)
      const theoretical = e.attempts.reduce(
        (acc, a) =>
          a.theoreticalTotal
            ? {
                correct: acc.correct + (a.theoreticalCorrect ?? 0),
                total: acc.total + a.theoreticalTotal,
              }
            : acc,
        { correct: 0, total: 0 },
      );
      const theoreticalCorrectRate =
        theoretical.total > 0
          ? Number(((theoretical.correct / theoretical.total) * 100).toFixed(2))
          : null;

      const graded = e.attempts.filter(
        (a) => a.practicalStatus === 'GRADED' && a.practicalScore !== null,
      );
      const avgPracticalScore =
        graded.length > 0
          ? Number(
              (
                graded.reduce((acc, a) => acc + (a.practicalScore ?? 0), 0) /
                graded.length
              ).toFixed(1),
            )
          : null;
      const pendingReviews = e.attempts.filter(
        (a) => a.practicalStatus === 'PENDING_REVIEW',
      ).length;

      return {
        id: e.id,
        title: e.title,
        courseId: e.course.id,
        courseTitle: e.course.title,
        totalAttempts,
        passedAttempts,
        failedAttempts,
        passRate,
        avgScore,
        theoreticalCorrectRate,
        avgPracticalScore,
        gradedPracticals: graded.length,
        pendingReviews,
      };
    });
  }

  async getCertificatesReport() {
    const certificates = await this.prisma.certificate.findMany({
      include: {
        user: {
          select: { id: true, name: true, lastname: true, email: true },
        },
        course: {
          select: { id: true, title: true, category: true },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return certificates.map((cert) => {
      const studentName =
        [cert.user.name, cert.user.lastname].filter(Boolean).join(' ') ||
        'Sin nombre';

      return {
        id: cert.id,
        studentId: cert.user.id,
        studentName,
        studentEmail: cert.user.email,
        courseId: cert.course.id,
        courseTitle: cert.course.title,
        courseCategory: cert.course.category,
        score: cert.score,
        issuedAt: cert.issuedAt,
      };
    });
  }

  async getStudentsProgressReport() {
    const userCourses = await this.prisma.userCourse.findMany({
      include: {
        user: {
          select: { id: true, name: true, lastname: true, email: true },
        },
        course: {
          select: { id: true, title: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return userCourses.map((uc) => {
      const studentName =
        [uc.user.name, uc.user.lastname].filter(Boolean).join(' ') ||
        'Sin nombre';

      return {
        id: `${uc.userId}-${uc.courseId}`,
        userId: uc.userId,
        studentName,
        studentEmail: uc.user.email,
        courseId: uc.courseId,
        courseTitle: uc.course.title,
        progress: uc.progress,
        status: uc.status,
        enrolledAt: uc.createdAt,
        updatedAt: uc.updatedAt,
      };
    });
  }

  async getMySummary(userId: string) {
    const [enrollments, completedLessons, certificates, attempts] =
      await Promise.all([
        this.prisma.userCourse.findMany({
          where: { userId },
          select: { status: true, progress: true },
        }),
        this.prisma.userLesson.count({ where: { userId, completed: true } }),
        this.prisma.certificate.count({ where: { userId } }),
        this.prisma.finalExamAttempt.findMany({
          where: { userId },
          select: { score: true, passed: true, practicalStatus: true },
        }),
      ]);

    const enrolledCourses = enrollments.length;
    const completedCourses = enrollments.filter(
      (e) => e.status === 'COMPLETED',
    ).length;
    const avgProgress =
      enrolledCourses > 0
        ? Math.round(
            enrollments.reduce((acc, e) => acc + (e.progress || 0), 0) /
              enrolledCourses,
          )
        : 0;
    const avgExamScore =
      attempts.length > 0
        ? Number(
            (
              attempts.reduce((acc, a) => acc + a.score, 0) / attempts.length
            ).toFixed(1),
          )
        : null;

    return {
      enrolledCourses,
      completedCourses,
      avgProgress,
      completedLessons,
      certificates,
      examAttempts: attempts.length,
      passedExams: attempts.filter((a) => a.passed).length,
      pendingPracticalReviews: attempts.filter(
        (a) => a.practicalStatus === 'PENDING_REVIEW',
      ).length,
      avgExamScore,
    };
  }
}
