import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class IndicatorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── SHEETS ─────────────────────────────────────────────────────────────────

  async findAllSheets() {
    return await this.prisma.indicatorSheet.findMany({
      include: { records: { orderBy: { itemNumber: 'asc' } } },
    });
  }

  async upsertSheet(
    code: string,
    testType: string,
    data: Omit<Prisma.IndicatorSheetCreateInput, 'code' | 'testType'> = {},
  ) {
    return await this.prisma.indicatorSheet.upsert({
      where: { code_testType: { code, testType } },
      create: { code, testType, ...data },
      update: data,
    });
  }

  // ── RECORDS ────────────────────────────────────────────────────────────────

  async findRecordById(id: string) {
    return await this.prisma.indicatorRecord.findUnique({
      where: { id },
      include: { sheet: true },
    });
  }

  async findRecordByItem(sheetId: string, itemNumber: number) {
    return await this.prisma.indicatorRecord.findUnique({
      where: { sheetId_itemNumber: { sheetId, itemNumber } },
    });
  }

  async getMaxItemNumber(sheetId: string): Promise<number> {
    const result = await this.prisma.indicatorRecord.aggregate({
      where: { sheetId },
      _max: { itemNumber: true },
    });
    return result._max.itemNumber ?? 0;
  }

  async createRecord(data: Prisma.IndicatorRecordUncheckedCreateInput) {
    return await this.prisma.indicatorRecord.create({ data });
  }

  async updateRecord(id: string, data: Prisma.IndicatorRecordUpdateInput) {
    return await this.prisma.indicatorRecord.update({ where: { id }, data });
  }

  async deleteRecord(id: string) {
    return await this.prisma.indicatorRecord.delete({ where: { id } });
  }

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
