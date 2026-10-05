import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { ExamsRepository } from '../repositories/exams.repository';
import { CoursesRepository } from '../../courses/repositories/courses.repository';
import {
  CreateFinalExamRequestDto,
  SubmitFinalExamRequestDto,
  FinalExamResponseDto,
  SubmitFinalExamResponseDto,
  ExamAttemptResponseDto,
  CertificateResponseDto,
} from '../dtos';
import { Prisma, type FinalExam } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { NotificationsService } from '../../notifications/services/notifications.service';

const PASSING_SCORE = 15; // out of 20

@Injectable()
export class ExamsService {
  constructor(
    private readonly examsRepository: ExamsRepository,
    private readonly coursesRepository: CoursesRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── CREATE FINAL EXAM (admin/instructor) ───────────────────────────────────

  async createExam(
    courseId: string,
    dto: CreateFinalExamRequestDto,
  ): Promise<FinalExamResponseDto> {
    // Verify course exists
    const course = await this.coursesRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException(`Course ${courseId} not found`);
    }

    const existing = await this.examsRepository.findExamByCourse(courseId);
    if (existing) {
      await this.examsRepository.deleteExam(existing.id);
    }

    const data: Prisma.FinalExamCreateInput = {
      title: dto.title,
      course: { connect: { id: courseId } },
      ...(dto.questions &&
        dto.questions.length > 0 && {
          questions: {
            create: dto.questions.map((q) => ({
              text: q.text,
              options: {
                create: q.options.map((o) => ({
                  text: o.text,
                  isCorrect: o.isCorrect ?? false,
                })),
              },
            })),
          },
        }),
    };

    return this.examsRepository.createExam(data);
  }

  async upsertExam(
    courseId: string,
    dto: CreateFinalExamRequestDto,
  ): Promise<FinalExamResponseDto> {
    const course = await this.coursesRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException(`Course ${courseId} not found`);
    }

    const existing = await this.examsRepository.findExamByCourse(courseId);
    if (existing) {
      await this.examsRepository.deleteExam(existing.id);
    }

    const data: Prisma.FinalExamCreateInput = {
      title: dto.title,
      course: { connect: { id: courseId } },
      ...(dto.questions &&
        dto.questions.length > 0 && {
          questions: {
            create: dto.questions.map((q) => ({
              text: q.text,
              options: {
                create: q.options.map((o) => ({
                  text: o.text,
                  isCorrect: o.isCorrect ?? false,
                })),
              },
            })),
          },
        }),
    };

    return this.examsRepository.createExam(data);
  }

  async getExamForAdmin(courseId: string) {
    const exam = await this.examsRepository.findExamByCourse(courseId);
    if (!exam) {
      throw new NotFoundException(`No final exam found for course ${courseId}`);
    }
    return exam;
  }

  // ── GET EXAM BY COURSE (student – options without isCorrect) ───────────────

  async getExamByCourse(courseId: string): Promise<FinalExamResponseDto> {
    const exam = await this.examsRepository.findExamByCourse(courseId);
    if (!exam) {
      throw new NotFoundException(`No final exam found for course ${courseId}`);
    }

    // Strip isCorrect from options so students can't cheat
    return {
      ...exam,
      questions: exam.questions.map((q) => ({
        ...q,
        options: q.options.map(({ isCorrect: _ic, ...rest }) => {
          void _ic;
          return rest;
        }),
      })),
    };
  }

  // ── SUBMIT EXAM ─────────────────────────────────────────────────────────────

  async submitExam(
    userId: string,
    courseId: string,
    dto: SubmitFinalExamRequestDto,
  ): Promise<SubmitFinalExamResponseDto> {
    const progress = await this.coursesRepository.getUserCourseProgress(
      userId,
      courseId,
    );
    if (!progress) {
      throw new BadRequestException('You are not enrolled in this course.');
    }

    const totalCourseLessons =
      await this.coursesRepository.countCourseLessons(courseId);
    const completedCount = progress.completedLessons?.length ?? 0;

    const isFullyCompleted =
      progress.status === 'COMPLETED' ||
      (totalCourseLessons > 0 && completedCount >= totalCourseLessons) ||
      totalCourseLessons === 0;

    if (!isFullyCompleted) {
      throw new BadRequestException(
        'You must complete all lessons before taking the final exam.',
      );
    }

    if (progress.status !== 'COMPLETED') {
      await this.coursesRepository.markCourseCompleted(userId, courseId);
    }

    const exam = await this.examsRepository.findExamByCourse(courseId);
    if (!exam) {
      throw new NotFoundException(`No final exam found for course ${courseId}`);
    }

    const totalQuestions = exam.questions.length;
    if (totalQuestions === 0) {
      throw new BadRequestException('The exam has no questions.');
    }

    // Score the answers
    let correctCount = 0;
    for (const answer of dto.answers) {
      const option = await this.examsRepository.findOptionById(
        answer.selectedOptionId,
      );
      if (
        option &&
        option.questionId === answer.questionId &&
        option.isCorrect
      ) {
        correctCount++;
      }
    }

    // Scale score to 20 points
    const score = parseFloat(((correctCount / totalQuestions) * 20).toFixed(2));
    const passed = score >= PASSING_SCORE;

    // Persist attempt
    const attempt = await this.examsRepository.saveAttempt({
      user: { connect: { id: userId } },
      exam: { connect: { id: exam.id } },
      score,
      total: totalQuestions,
      passed,
    });

    // Issue certificate if passed
    let certificate: CertificateResponseDto | null = null;
    if (passed) {
      const createdCert = await this.examsRepository.upsertCertificate(
        userId,
        courseId,
        score,
      );
      certificate = createdCert;

      try {
        await this.notificationsService.createCourseCompletedNotification({
          userId,
          courseId,
          score,
          certificateId: createdCert.id,
          completedAt: new Date().toISOString(),
        });
      } catch (notifErr) {
        console.error('Error al generar notificación de curso completado:', notifErr);
      }
    }

    return {
      score,
      total: totalQuestions,
      correct: correctCount,
      passed,
      attempt,
      certificate,
    };
  }

  // ── GET LAST ATTEMPT ───────────────────────────────────────────────────────

  async getLastAttempt(
    userId: string,
    courseId: string,
  ): Promise<ExamAttemptResponseDto> {
    const exam = await this.examsRepository.findExamByCourse(courseId);
    if (!exam) {
      throw new NotFoundException(`No final exam found for course ${courseId}`);
    }

    const attempt = await this.examsRepository.getLastAttempt(userId, exam.id);
    if (!attempt) {
      return { hasAttempted: false };
    }

    return { hasAttempted: true, ...attempt };
  }

  // ── GET CERTIFICATE ─────────────────────────────────────────────────────────

  async getCertificate(
    userId: string,
    courseId: string,
  ): Promise<CertificateResponseDto> {
    const cert = await this.examsRepository.findCertificate(userId, courseId);
    if (!cert) {
      throw new NotFoundException(
        'No certificate found. Pass the final exam with a score ≥ 15/20.',
      );
    }
    return cert;
  }

  // ── DELETE EXAM ────────────────────────────────────────────────────────────

  async deleteExam(examId: string): Promise<FinalExam> {
    const exam = await this.examsRepository.findExamById(examId);
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }
    return await this.examsRepository.deleteExam(examId);
  }

  // ── GENERATE CERTIFICATE PDF ────────────────────────────────────────────────

  async generateCertificatePdf(
    userId: string,
    courseId: string,
    res: Response,
  ): Promise<void> {
    const cert = await this.examsRepository.findCertificate(userId, courseId);
    if (!cert) {
      throw new NotFoundException(
        'No certificate found. Pass the final exam with a score ≥ 15/20.',
      );
    }

    const studentName =
      `${cert.user.name ?? ''} ${cert.user.lastname ?? ''}`.trim() ||
      'Estudiante';
    const courseTitle = cert.course.title;
    const score = cert.score;
    const issuedAt = new Date(cert.issuedAt).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="certificado-${courseId}.pdf"`,
    );

    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 50,
    });

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // ── Background ────────────────────────────────────────────────────────────
    doc.rect(0, 0, pageWidth, pageHeight).fill('#0f172a');

    // Decorative border
    doc
      .rect(20, 20, pageWidth - 40, pageHeight - 40)
      .lineWidth(3)
      .stroke('#6366f1');

    doc
      .rect(28, 28, pageWidth - 56, pageHeight - 56)
      .lineWidth(1)
      .stroke('#818cf8');

    // ── Header ─────────────────────────────────────────────────────────────────
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#818cf8')
      .text('CERTIFICADO DE FINALIZACIÓN', 0, 60, { align: 'center' });

    // Decorative line
    doc
      .moveTo(pageWidth / 2 - 120, 82)
      .lineTo(pageWidth / 2 + 120, 82)
      .lineWidth(1)
      .stroke('#6366f1');

    // ── Main title ─────────────────────────────────────────────────────────────
    doc
      .font('Helvetica-Bold')
      .fontSize(42)
      .fillColor('#ffffff')
      .text('Certificado', 0, 100, { align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(16)
      .fillColor('#94a3b8')
      .text('de Aprovechamiento y Finalización', 0, 150, { align: 'center' });

    // ── Recipient ──────────────────────────────────────────────────────────────
    doc
      .font('Helvetica')
      .fontSize(16)
      .fillColor('#94a3b8')
      .text('Se certifica que', 0, 200, { align: 'center' });

    doc
      .font('Helvetica-Bold')
      .fontSize(34)
      .fillColor('#a5b4fc')
      .text(studentName, 0, 225, { align: 'center' });

    // Underline for name
    const nameWidth = doc.widthOfString(studentName);
    const nameX = (pageWidth - nameWidth) / 2;
    doc
      .moveTo(nameX, 265)
      .lineTo(nameX + nameWidth, 265)
      .lineWidth(1)
      .stroke('#6366f1');

    // ── Course ─────────────────────────────────────────────────────────────────
    doc
      .font('Helvetica')
      .fontSize(16)
      .fillColor('#94a3b8')
      .text('ha completado satisfactoriamente el curso', 0, 280, {
        align: 'center',
      });

    doc
      .font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('#ffffff')
      .text(`"${courseTitle}"`, 0, 308, { align: 'center' });

    // ── Score badge ────────────────────────────────────────────────────────────
    const badgeCenterX = pageWidth / 2;
    const badgeY = 365;

    doc.roundedRect(badgeCenterX - 80, badgeY, 160, 50, 25).fill('#6366f1');

    doc
      .font('Helvetica-Bold')
      .fontSize(24)
      .fillColor('#ffffff')
      .text(`${score} / 20`, badgeCenterX - 80, badgeY + 13, {
        width: 160,
        align: 'center',
      });

    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#94a3b8')
      .text('Puntuación obtenida', 0, badgeY + 58, { align: 'center' });

    // ── Footer ─────────────────────────────────────────────────────────────────
    doc
      .moveTo(pageWidth / 2 - 120, pageHeight - 100)
      .lineTo(pageWidth / 2 + 120, pageHeight - 100)
      .lineWidth(1)
      .stroke('#6366f1');

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#ffffff')
      .text('DeployLab Academy', 0, pageHeight - 90, { align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#64748b')
      .text(`Emitido el ${issuedAt}`, 0, pageHeight - 70, { align: 'center' });

    doc.end();
  }
}
