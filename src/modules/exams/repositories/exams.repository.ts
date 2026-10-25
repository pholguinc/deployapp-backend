import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, type FinalExam } from '@prisma/client';

@Injectable()
export class ExamsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── FINAL EXAM ─────────────────────────────────────────────────────────────

  async createExam(data: Prisma.FinalExamCreateInput) {
    return await this.prisma.finalExam.create({
      data,
      include: {
        questions: { include: { options: true } },
      },
    });
  }

  async findExamByCourse(courseId: string) {
    return await this.prisma.finalExam.findUnique({
      where: { courseId },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });
  }

  async findExamById(id: string) {
    return this.prisma.finalExam.findUnique({
      where: { id },
      include: {
        questions: { include: { options: true } },
      },
    });
  }

  async deleteExam(id: string): Promise<FinalExam> {
    return this.prisma.finalExam.delete({ where: { id } });
  }

  async updateExam(id: string, data: Prisma.FinalExamUpdateInput): Promise<FinalExam> {
    return this.prisma.finalExam.update({ where: { id }, data });
  }

  // ── EXAM SUBMISSION ─────────────────────────────────────────────────────────

  async saveAttempt(data: Prisma.FinalExamAttemptCreateInput) {
    return this.prisma.finalExamAttempt.create({ data });
  }

  async updateAttempt(id: string, data: Prisma.FinalExamAttemptUpdateInput) {
    return this.prisma.finalExamAttempt.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true, lastname: true, email: true } },
        gradedBy: { select: { id: true, name: true, lastname: true, email: true } },
      },
    });
  }

  async findAttemptById(id: string) {
    return this.prisma.finalExamAttempt.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, lastname: true, email: true } },
        exam: { select: { id: true, courseId: true, title: true } },
        gradedBy: { select: { id: true, name: true, lastname: true, email: true } },
      },
    });
  }

  async getLastAttempt(userId: string, examId: string) {
    return this.prisma.finalExamAttempt.findFirst({
      where: { userId, examId },
      orderBy: { createdAt: 'desc' },
      include: {
        gradedBy: { select: { id: true, name: true, lastname: true, email: true } },
      },
    });
  }

  async findAttemptsByCourse(courseId: string) {
    return this.prisma.finalExamAttempt.findMany({
      where: {
        exam: { courseId },
      },
      include: {
        user: { select: { id: true, name: true, lastname: true, email: true } },
        gradedBy: { select: { id: true, name: true, lastname: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countOptions(questionId: string) {
    return this.prisma.finalExamOption.findMany({ where: { questionId } });
  }

  async findOptionById(optionId: string) {
    return this.prisma.finalExamOption.findUnique({ where: { id: optionId } });
  }

  // ── CERTIFICATES ────────────────────────────────────────────────────────────

  async upsertCertificate(userId: string, courseId: string, score: number) {
    return this.prisma.certificate.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, score },
      update: { score },
      include: {
        user: { select: { id: true, name: true, lastname: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });
  }

  async findCertificate(userId: string, courseId: string) {
    return this.prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: {
        user: { select: { id: true, name: true, lastname: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });
  }
}
