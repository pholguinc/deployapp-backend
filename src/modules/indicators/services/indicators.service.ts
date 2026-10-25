import { Injectable } from '@nestjs/common';
import { IndicatorsRepository } from '../repositories/indicators.repository';
import {
  DEFAULT_COMPANY,
  INDICATOR_DEFINITIONS,
  STUDY_VARIABLE,
  computeIndicatorValue,
  round2,
  type IndicatorDefinition,
} from '../constants/indicator-definitions';

type ExamAttempt = Awaited<
  ReturnType<IndicatorsRepository['findExamAttempts']>
>[number];

// Medición de un intento de examen para un indicador
export interface AppMetricRow {
  attemptId: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  date: Date;
  submittedAt: Date;
  numerator: number;
  denominator: number;
  value: number | null;
}

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

  /**
   * Fichas de registro de los indicadores: se calculan como un reporte,
   * aplicando la fórmula de cada indicador a las evaluaciones rendidas en la app.
   */
  async getIndicatorsReport() {
    const attempts = await this.indicatorsRepository.findExamAttempts();

    const indicators = INDICATOR_DEFINITIONS.map((definition) => {
      const app = this.buildAppMetrics(definition, attempts);
      return {
        ...definition,
        variable: STUDY_VARIABLE,
        sheet: this.buildSheet(definition, app.rows),
        app,
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

  // ── HELPERS ────────────────────────────────────────────────────────────────

  /**
   * Ficha de registro generada con los datos de la app: cada ítem agrupa las
   * evaluaciones de una misma fecha y aplica la fórmula del indicador.
   */
  private buildSheet(definition: IndicatorDefinition, rows: AppMetricRow[]) {
    const byDate = new Map<string, AppMetricRow[]>();
    for (const row of rows) {
      const key = row.date.toISOString().slice(0, 10);
      byDate.set(key, [...(byDate.get(key) ?? []), row]);
    }

    const records = [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, group], i) => {
        const numerator = round2(
          group.reduce((acc, r) => acc + r.numerator, 0),
        );
        const denominator = round2(
          group.reduce((acc, r) => acc + r.denominator, 0),
        );
        // El periodo va desde el primer envío del grupo hasta su fecha de evaluación
        const firstSubmission = group
          .map((r) => r.submittedAt.toISOString().slice(0, 10))
          .reduce((min, d) => (d < min ? d : min), day);
        return {
          id: `${definition.code}-${day}`,
          itemNumber: i + 1,
          startDate: new Date(firstSubmission),
          endDate: new Date(day),
          participants: new Set(group.map((r) => r.userId)).size,
          numerator,
          denominator,
          value: computeIndicatorValue(definition, numerator, denominator),
        };
      });

    const totalNumerator = round2(
      records.reduce((acc, r) => acc + r.numerator, 0),
    );
    const totalDenominator = round2(
      records.reduce((acc, r) => acc + r.denominator, 0),
    );

    return {
      company: DEFAULT_COMPANY,
      startDate: records[0]?.startDate ?? null,
      endDate: records[records.length - 1]?.endDate ?? null,
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
    const rows = attempts.flatMap((a): AppMetricRow[] => {
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
          // Fecha de evaluación: calificación del práctico o envío del teórico
          date: a.practicalGradedAt ?? a.updatedAt ?? a.createdAt,
          submittedAt: a.createdAt,
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
}
