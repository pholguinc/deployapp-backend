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
  GradePracticalExamRequestDto,
} from '../dtos';
import { Prisma, type FinalExam } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { UploadService } from '../../upload/upload.service';

const PASSING_SCORE = 15; // out of 20

@Injectable()
export class ExamsService {
  constructor(
    private readonly examsRepository: ExamsRepository,
    private readonly coursesRepository: CoursesRepository,
    private readonly notificationsService: NotificationsService,
    private readonly uploadService: UploadService,
  ) {}

  // ── CREATE FINAL EXAM (admin/instructor) ───────────────────────────────────

  async createExam(
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
      practicalTitle: dto.practicalTitle ?? 'Caso Práctico de Despliegue de Servicios',
      practicalInstructions: dto.practicalInstructions ?? null,
      practicalRubric: dto.practicalRubric ?? null,
      practicalGuideUrl: dto.practicalGuideUrl ?? null,
      practicalPdfUrl: dto.practicalPdfUrl ?? dto.practicalGuideUrl ?? null,
      practicalPdfName: dto.practicalPdfName ?? null,
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
      practicalTitle: dto.practicalTitle ?? 'Caso Práctico de Despliegue de Servicios',
      practicalInstructions: dto.practicalInstructions ?? null,
      practicalRubric: dto.practicalRubric ?? null,
      practicalGuideUrl: dto.practicalGuideUrl ?? null,
      practicalPdfUrl: dto.practicalPdfUrl ?? dto.practicalGuideUrl ?? null,
      practicalPdfName: dto.practicalPdfName ?? null,
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

  // ── SUBMIT THEORETICAL EXAM ─────────────────────────────────────────────────

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

    // Score the theoretical answers
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

    // Scale theoretical score to 20 points
    const theoreticalScore = parseFloat(
      ((correctCount / totalQuestions) * 20).toFixed(2),
    );
    const theoreticalPassed = theoreticalScore >= PASSING_SCORE;

    // Check if an attempt already exists (e.g. practical PDF already uploaded)
    const existingAttempt = await this.examsRepository.getLastAttempt(
      userId,
      exam.id,
    );

    let finalScore = theoreticalScore;
    let passed = false;
    let certificate: CertificateResponseDto | null = null;

    // Si ya tiene examen práctico calificado, promediar los 2:
    if (
      existingAttempt &&
      existingAttempt.practicalStatus === 'GRADED' &&
      existingAttempt.practicalScore !== null
    ) {
      finalScore = parseFloat(
        ((theoreticalScore + existingAttempt.practicalScore) / 2).toFixed(2),
      );
      passed = finalScore >= PASSING_SCORE;
    } else {
      // Falta revisión o subida del práctico: no se aprueba automáticamente aún
      passed = false;
    }

    let attempt: any;
    if (existingAttempt) {
      attempt = await this.examsRepository.updateAttempt(existingAttempt.id, {
        score: finalScore,
        total: totalQuestions,
        passed,
        theoreticalScore,
        theoreticalCorrect: correctCount,
        theoreticalTotal: totalQuestions,
        theoreticalPassed,
      });
    } else {
      attempt = await this.examsRepository.saveAttempt({
        user: { connect: { id: userId } },
        exam: { connect: { id: exam.id } },
        score: finalScore,
        total: totalQuestions,
        passed,
        theoreticalScore,
        theoreticalCorrect: correctCount,
        theoreticalTotal: totalQuestions,
        theoreticalPassed,
        practicalStatus: 'NOT_SUBMITTED',
      });
    }

    // Solo se emite certificado si ambos componentes están aprobados y el promedio >= PASSING_SCORE
    if (passed) {
      const createdCert = await this.examsRepository.upsertCertificate(
        userId,
        courseId,
        finalScore,
      );
      certificate = createdCert;

      try {
        await this.notificationsService.createCourseCompletedNotification({
          userId,
          courseId,
          score: finalScore,
          certificateId: createdCert.id,
          completedAt: new Date().toISOString(),
        });
      } catch (notifErr) {
        console.error(
          'Error al generar notificación de curso completado:',
          notifErr,
        );
      }
    }

    return {
      score: finalScore,
      total: totalQuestions,
      correct: correctCount,
      passed,
      attempt,
      certificate,
    };
  }

  // ── SUBMIT PRACTICAL EXAM (Student PDF upload) ───────────────────────────────

  async submitPracticalExam(
    userId: string,
    courseId: string,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Debes adjuntar un archivo PDF con tu informe o evidencia técnica.',
      );
    }

    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      throw new BadRequestException(
        'El archivo de entrega práctica debe ser un PDF válido.',
      );
    }

    const progress = await this.coursesRepository.getUserCourseProgress(
      userId,
      courseId,
    );
    if (!progress) {
      throw new BadRequestException('No estás inscrito en este curso.');
    }

    const exam = await this.examsRepository.findExamByCourse(courseId);
    if (!exam) {
      throw new NotFoundException(
        `No se encontró el examen final para el curso ${courseId}`,
      );
    }

    // Subir archivo al bucket S3 o storage
    const fileUrl = await this.uploadService.uploadFile(
      file,
      'practical-exams',
    );

    const existingAttempt = await this.examsRepository.getLastAttempt(
      userId,
      exam.id,
    );

    if (existingAttempt) {
      return this.examsRepository.updateAttempt(existingAttempt.id, {
        practicalFileUrl: fileUrl,
        practicalFileName: file.originalname,
        practicalSubmittedAt: new Date(),
        practicalStatus: 'PENDING_REVIEW',
      });
    } else {
      return this.examsRepository.saveAttempt({
        user: { connect: { id: userId } },
        exam: { connect: { id: exam.id } },
        score: 0,
        total: exam.questions?.length ?? 0,
        passed: false,
        practicalFileUrl: fileUrl,
        practicalFileName: file.originalname,
        practicalSubmittedAt: new Date(),
        practicalStatus: 'PENDING_REVIEW',
      });
    }
  }

  // ── GET PRACTICAL SUBMISSIONS (Admin / Instructor) ──────────────────────────

  async getPracticalSubmissions(courseId: string) {
    const exam = await this.examsRepository.findExamByCourse(courseId);
    if (!exam) {
      throw new NotFoundException(`No final exam found for course ${courseId}`);
    }
    const attempts = await this.examsRepository.findAttemptsByCourse(courseId);
    return attempts.map((a) => {
      const isGraded = a.practicalStatus === 'GRADED';
      const theoreticalScore = a.theoreticalScore ?? a.score ?? 0;
      const practicalScore = a.practicalScore;
      const finalScore = isGraded && practicalScore !== null && practicalScore !== undefined
        ? parseFloat(((theoreticalScore + practicalScore) / 2).toFixed(2))
        : null;
      const passed = isGraded && finalScore !== null && finalScore >= PASSING_SCORE;

      return {
        ...a,
        theoreticalScore,
        practicalScore,
        score: finalScore ?? theoreticalScore,
        passed,
      };
    });
  }

  // ── UPLOAD PRACTICAL GUIDE PDF (Admin / Instructor) ─────────────────────────

  async uploadPracticalGuide(courseId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Debes proporcionar un archivo PDF.');
    }
    const fileUrl = await this.uploadService.uploadFile(file, 'course-practical-exams');
    const exam = await this.examsRepository.findExamByCourse(courseId);
    if (exam) {
      await this.examsRepository.updateExam(exam.id, {
        practicalGuideUrl: fileUrl,
        practicalPdfUrl: fileUrl,
        practicalPdfName: file.originalname,
      });
    }
    return { url: fileUrl, fileName: file.originalname };
  }

  // ── UPLOAD STUDENT PRACTICAL FILE (Admin / Docente manual upload) ───────────

  async uploadStudentPracticalFile(
    courseId: string,
    attemptId: string,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Debes proporcionar un archivo PDF.');
    }
    const attempt = await this.examsRepository.findAttemptById(attemptId);
    if (!attempt || attempt.exam.courseId !== courseId) {
      throw new NotFoundException(`Intento #${attemptId} no encontrado para este curso`);
    }

    const fileUrl = await this.uploadService.uploadFile(file, 'practical-exams');
    return this.examsRepository.updateAttempt(attemptId, {
      practicalFileUrl: fileUrl,
      practicalFileName: file.originalname,
      practicalSubmittedAt: new Date(),
      practicalStatus: 'PENDING_REVIEW',
    });
  }

  // ── GRADE PRACTICAL EXAM (Admin / Instructor) ───────────────────────────────

  async gradePracticalExam(
    courseId: string,
    attemptId: string,
    graderId: string,
    dto: GradePracticalExamRequestDto,
  ) {
    const attempt = await this.examsRepository.findAttemptById(attemptId);
    if (!attempt || attempt.exam.courseId !== courseId) {
      throw new NotFoundException(
        `Intento de examen #${attemptId} no encontrado para este curso.`,
      );
    }

    const practicalScore = parseFloat(Number(dto.practicalScore).toFixed(2));
    const theoreticalScore = attempt.theoreticalScore ?? attempt.score ?? 0;

    // Promedio de ambos componentes juntos: (teórico + práctico) / 2
    const finalScore = parseFloat(
      ((theoreticalScore + practicalScore) / 2).toFixed(2),
    );
    const passed = finalScore >= PASSING_SCORE;

    if (
      dto.incidentsInjected !== undefined &&
      dto.incidentsResolved !== undefined &&
      dto.incidentsResolved > dto.incidentsInjected
    ) {
      throw new BadRequestException(
        'Las incidencias resueltas no pueden superar a las incidencias inyectadas.',
      );
    }

    const updated = await this.examsRepository.updateAttempt(attemptId, {
      practicalScore,
      practicalTasksEvaluated: dto.practicalTasksEvaluated,
      practicalTotalMinutes: dto.practicalTotalMinutes,
      incidentsInjected: dto.incidentsInjected,
      incidentsResolved: dto.incidentsResolved,
      practicalFeedback: dto.feedback ?? null,
      practicalGradedAt: new Date(),
      practicalStatus: 'GRADED',
      gradedBy: { connect: { id: graderId } },
      score: finalScore,
      passed,
    });

    let certificate: CertificateResponseDto | null = null;
    if (passed) {
      // Recién se emite el certificado tras aprobar en promedio teórico + práctico
      certificate = await this.examsRepository.upsertCertificate(
        attempt.userId,
        courseId,
        finalScore,
      );

      try {
        await this.notificationsService.createCourseCompletedNotification({
          userId: attempt.userId,
          courseId,
          score: finalScore,
          certificateId: certificate.id,
          completedAt: new Date().toISOString(),
        });
      } catch (notifErr) {
        console.error(
          'Error al generar notificación de certificado:',
          notifErr,
        );
      }
    }

    return {
      success: true,
      attempt: updated,
      finalScore,
      passed,
      certificate,
      message: passed
        ? `Examen práctico calificado con ${practicalScore}/20. Promedio final: ${finalScore}/20. ¡Certificado emitido exitosamente!`
        : `Examen práctico calificado con ${practicalScore}/20. Promedio final: ${finalScore}/20. No alcanza el puntaje mínimo de ${PASSING_SCORE}/20.`,
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
        `No certificate found. Both theoretical and practical exams must be approved with an average score ≥ ${PASSING_SCORE}/20.`,
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
        `No certificate found. Pass the final exam with an average score ≥ ${PASSING_SCORE}/20.`,
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
      .text('Promedio Final Obtenido', 0, badgeY + 58, { align: 'center' });

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
