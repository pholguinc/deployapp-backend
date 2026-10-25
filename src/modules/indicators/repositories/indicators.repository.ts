import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class IndicatorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── APP DATA (intentos de examen final) ────────────────────────────────────

  async findExamAttempts(userId?: string) {
    return await this.prisma.finalExamAttempt.findMany({
      where: userId ? { userId } : undefined,
      include: {
        user: { select: { id: true, name: true, lastname: true, email: true } },
        exam: { select: { course: { select: { id: true, title: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
