import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IndicatorRecord, IndicatorSheet } from '@prisma/client';
import { IndicatorsRepository } from '../repositories/indicators.repository';
import {
  CreateIndicatorRecordDto,
  UpdateIndicatorRecordDto,
  UpdateIndicatorSheetDto,
} from '../dtos/indicator.dto';
import {
  DEFAULT_COMPANY,
  INDICATOR_DEFINITIONS,
  STUDY_VARIABLE,
  TEST_TYPES,
  TEST_TYPE_LABELS,
  compareIndicator,
  computeIndicatorValue,
  findIndicatorDefinition,
  type IndicatorDefinition,
  type TestType,
} from '../constants/indicator-definitions';

type ExamAttempt = Awaited<
  ReturnType<IndicatorsRepository['findExamAttempts']>
>[number];

// Numerador / denominador que aporta cada intento de examen a cada indicador
const ATTEMPT_METRICS: Record<
  string,
  (a: ExamAttempt) => { numerator: number; denominator: number } | null
> = {
  'IND-01': (a) =>
    a.theoreticalCorrect != null && a.theoreticalTotal
      ? { numerator: a.theoreticalCorrect, denominator: a.theoreticalTotal }
      : null,
  'IND-02': (a) =>
    a.practicalTotalMinutes != null && a.practicalTasksEvaluated
      ? {
          numerator: a.practicalTotalMinutes,
          denominator: a.practicalTasksEvaluated,
        }
      : null,
  'IND-03': (a) =>
    a.incidentsResolved != null && a.incidentsInjected
      ? { numerator: a.incidentsResolved, denominator: a.incidentsInjected }
      : null,
};

@Injectable()
export class IndicatorsService {
  constructor(private readonly indicatorsRepository: IndicatorsRepository) {}

  // ── LECTURA ────────────────────────────────────────────────────────────────

  /** Fichas de registro pre/post-test, comparación y datos de la aplicación. */
  async getIndicatorsReport() {
    const [sheets, attempts] = await Promise.all([
      this.indicatorsRepository.findAllSheets(),
      this.indicatorsRepository.findExamAttempts(),
    ]);

    const indicators = INDICATOR_DEFINITIONS.map((definition) => {
      const pre = this.buildSheet(definition, 'PRE_TEST', sheets);
      const post = this.buildSheet(definition, 'POST_TEST', sheets);

      return {
        ...definition,
        variable: STUDY_VARIABLE,
        sheets: { PRE_TEST: pre, POST_TEST: post },
        comparison: compareIndicator(
          definition,
          pre.summary.value,
          post.summary.value,
        ),
        app: this.buildAppMetrics(definition, attempts),
      };
    });

    return {
      company: DEFAULT_COMPANY,
      variable: STUDY_VARIABLE,
      indicators,
    };
  }

  /** Indicadores del propio estudiante calculados con sus intentos en la app. */
  async getMyIndicators(userId: string) {
    const attempts = await this.indicatorsRepository.findExamAttempts(userId);

    return {
      variable: STUDY_VARIABLE,
      indicators: INDICATOR_DEFINITIONS.map((definition) => {
        const app = this.buildAppMetrics(definition, attempts);
        return {
          code: definition.code,
          number: definition.number,
          dimension: definition.dimension,
          name: definition.name,
          unit: definition.unit,
          formula: definition.formula,
          numeratorLabel: definition.numeratorLabel,
          denominatorLabel: definition.denominatorLabel,
          betterWhen: definition.betterWhen,
          ...app.summary,
          history: app.rows.map((r) => ({
            attemptId: r.attemptId,
            courseTitle: r.courseTitle,
            date: r.date,
            numerator: r.numerator,
            denominator: r.denominator,
            value: r.value,
          })),
        };
      }),
    };
  }

  // ── ESCRITURA ──────────────────────────────────────────────────────────────

  async updateSheet(
    code: string,
    testType: string,
    dto: UpdateIndicatorSheetDto,
  ) {
    this.assertSheetKey(code, testType);
    return await this.indicatorsRepository.upsertSheet(code, testType, {
      company: dto.company,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });
  }

  async createRecord(
    code: string,
    testType: string,
    dto: CreateIndicatorRecordDto,
  ) {
    const definition = this.assertSheetKey(code, testType);
    const sheet = await this.indicatorsRepository.upsertSheet(code, testType);

    const itemNumber =
      dto.itemNumber ??
      (await this.indicatorsRepository.getMaxItemNumber(sheet.id)) + 1;
    await this.assertItemAvailable(sheet.id, itemNumber);
    this.assertValidRatio(definition, dto.numerator, dto.denominator);

    const record = await this.indicatorsRepository.createRecord({
      sheetId: sheet.id,
      itemNumber,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      group: dto.group ?? null,
      numerator: dto.numerator,
      denominator: dto.denominator,
      notes: dto.notes ?? null,
    });
    return this.toRecordResponse(definition, record);
  }

  async updateRecord(id: string, dto: UpdateIndicatorRecordDto) {
    const existing = await this.indicatorsRepository.findRecordById(id);
    if (!existing) {
      throw new NotFoundException(
        `Registro de indicador #${id} no encontrado.`,
      );
    }
    const definition = findIndicatorDefinition(existing.sheet.code)!;

    if (dto.itemNumber && dto.itemNumber !== existing.itemNumber) {
      await this.assertItemAvailable(existing.sheetId, dto.itemNumber);
    }
    this.assertValidRatio(
      definition,
      dto.numerator ?? existing.numerator,
      dto.denominator ?? existing.denominator,
    );

    const record = await this.indicatorsRepository.updateRecord(id, {
      itemNumber: dto.itemNumber,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      group: dto.group,
      numerator: dto.numerator,
      denominator: dto.denominator,
      notes: dto.notes,
    });
    return this.toRecordResponse(definition, record);
  }

  async deleteRecord(id: string) {
    const existing = await this.indicatorsRepository.findRecordById(id);
    if (!existing) {
      throw new NotFoundException(
        `Registro de indicador #${id} no encontrado.`,
      );
    }
    await this.indicatorsRepository.deleteRecord(id);
    return { success: true };
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────

  private buildSheet(
    definition: IndicatorDefinition,
    testType: TestType,
    sheets: (IndicatorSheet & { records: IndicatorRecord[] })[],
  ) {
    const sheet = sheets.find(
      (s) => s.code === definition.code && s.testType === testType,
    );
    const records = (sheet?.records ?? []).map((r) =>
      this.toRecordResponse(definition, r),
    );

    // Total / Promedio de la ficha: Σ numerador / Σ denominador (ponderado por periodo)
    const totalNumerator = records.reduce((acc, r) => acc + r.numerator, 0);
    const totalDenominator = records.reduce((acc, r) => acc + r.denominator, 0);

    return {
      id: sheet?.id ?? null,
      testType,
      testTypeLabel: TEST_TYPE_LABELS[testType],
      company: sheet?.company ?? DEFAULT_COMPANY,
      startDate: sheet?.startDate ?? records[0]?.startDate ?? null,
      endDate:
        sheet?.endDate ??
        records[records.length - 1]?.endDate ??
        records[records.length - 1]?.startDate ??
        null,
      records,
      summary: {
        periods: records.length,
        totalNumerator,
        totalDenominator,
        value: computeIndicatorValue(
          definition,
          totalNumerator,
          totalDenominator,
        ),
      },
    };
  }

  private buildAppMetrics(
    definition: IndicatorDefinition,
    attempts: ExamAttempt[],
  ) {
    const metric = ATTEMPT_METRICS[definition.code];
    const rows = attempts.flatMap((a) => {
      const m = metric(a);
      if (!m) return [];
      return [
        {
          attemptId: a.id,
          userId: a.user.id,
          studentName:
            [a.user.name, a.user.lastname].filter(Boolean).join(' ') ||
            a.user.email,
          studentEmail: a.user.email,
          courseTitle: a.exam.course.title,
          date: a.practicalGradedAt ?? a.updatedAt ?? a.createdAt,
          numerator: m.numerator,
          denominator: m.denominator,
          value: computeIndicatorValue(definition, m.numerator, m.denominator),
        },
      ];
    });

    const totalNumerator = rows.reduce((acc, r) => acc + r.numerator, 0);
    const totalDenominator = rows.reduce((acc, r) => acc + r.denominator, 0);

    return {
      rows,
      summary: {
        evaluations: rows.length,
        participants: new Set(rows.map((r) => r.userId)).size,
        totalNumerator,
        totalDenominator,
        value: computeIndicatorValue(
          definition,
          totalNumerator,
          totalDenominator,
        ),
      },
    };
  }

  private toRecordResponse(
    definition: IndicatorDefinition,
    record: IndicatorRecord,
  ) {
    return {
      id: record.id,
      itemNumber: record.itemNumber,
      startDate: record.startDate,
      endDate: record.endDate,
      group: record.group,
      numerator: record.numerator,
      denominator: record.denominator,
      value: computeIndicatorValue(
        definition,
        record.numerator,
        record.denominator,
      ),
      notes: record.notes,
    };
  }

  private assertSheetKey(code: string, testType: string): IndicatorDefinition {
    const definition = findIndicatorDefinition(code);
    if (!definition) {
      throw new BadRequestException(
        `Indicador ${code} no válido. Use: ${INDICATOR_DEFINITIONS.map((d) => d.code).join(', ')}.`,
      );
    }
    if (!TEST_TYPES.includes(testType as TestType)) {
      throw new BadRequestException(
        `Tipo de prueba ${testType} no válido. Use: ${TEST_TYPES.join(', ')}.`,
      );
    }
    return definition;
  }

  private async assertItemAvailable(sheetId: string, itemNumber: number) {
    const taken = await this.indicatorsRepository.findRecordByItem(
      sheetId,
      itemNumber,
    );
    if (taken) {
      throw new ConflictException(
        `Ya existe el ítem ${itemNumber} en esta ficha de registro.`,
      );
    }
  }

  private assertValidRatio(
    definition: IndicatorDefinition,
    numerator: number,
    denominator: number,
  ) {
    // En los indicadores porcentuales el numerador no puede superar al denominador
    if (definition.unit === '%' && numerator > denominator) {
      throw new BadRequestException(
        `${definition.numeratorLabel} no puede ser mayor que ${definition.denominatorLabel.toLowerCase()}.`,
      );
    }
  }
}
