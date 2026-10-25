import { Test, TestingModule } from '@nestjs/testing';
import { IndicatorsService } from '../services/indicators.service';
import { IndicatorsRepository } from '../repositories/indicators.repository';
import {
  DEFAULT_COMPANY,
  STUDY_VARIABLE,
} from '../constants/indicator-definitions';

type AttemptOverrides = Record<string, unknown> & {
  userId?: string;
  name?: string | null;
  lastname?: string | null;
};

const buildAttempt = ({
  userId = 'user-1',
  name = 'Ana',
  lastname = 'Pérez',
  ...overrides
}: AttemptOverrides = {}) => ({
  id: 'attempt-1',
  theoreticalCorrect: null,
  theoreticalTotal: null,
  practicalTotalMinutes: null,
  practicalTasksEvaluated: null,
  incidentsResolved: null,
  incidentsInjected: null,
  practicalGradedAt: null,
  createdAt: new Date('2026-05-04T10:00:00Z'),
  updatedAt: new Date('2026-05-04T10:00:00Z'),
  user: { id: userId, name, lastname, email: `${userId}@mail.com` },
  exam: { course: { id: 'course-1', title: 'Docker' } },
  ...overrides,
});

describe('IndicatorsService', () => {
  let service: IndicatorsService;
  let repository: { findExamAttempts: jest.Mock };

  beforeEach(async () => {
    repository = { findExamAttempts: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndicatorsService,
        { provide: IndicatorsRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<IndicatorsService>(IndicatorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getIndicatorsReport', () => {
    it('should return the three indicators with empty sheets when there are no attempts', async () => {
      const report = await service.getIndicatorsReport();

      expect(repository.findExamAttempts).toHaveBeenCalledWith();
      expect(report.company).toBe(DEFAULT_COMPANY);
      expect(report.variable).toBe(STUDY_VARIABLE);
      expect(report.indicators.map((i) => i.code)).toEqual([
        'IND-01',
        'IND-02',
        'IND-03',
      ]);
      for (const ind of report.indicators) {
        expect(ind.sheet.records).toEqual([]);
        expect(ind.sheet.startDate).toBeNull();
        expect(ind.sheet.summary).toEqual({
          periods: 0,
          totalNumerator: 0,
          totalDenominator: 0,
          value: null,
        });
        expect(ind.app.summary.value).toBeNull();
      }
    });

    it('should not expose pre-test data', async () => {
      const report = await service.getIndicatorsReport();
      const ind = report.indicators[0] as Record<string, unknown>;

      expect(ind.sheets).toBeUndefined();
      expect(ind.comparison).toBeUndefined();
    });

    it('should map each attempt metric to its indicator', async () => {
      repository.findExamAttempts.mockResolvedValue([
        buildAttempt({
          theoreticalCorrect: 15,
          theoreticalTotal: 20,
          practicalTotalMinutes: 50,
          practicalTasksEvaluated: 2,
          incidentsResolved: 3,
          incidentsInjected: 4,
        }),
      ]);

      const { indicators } = await service.getIndicatorsReport();
      const [ind01, ind02, ind03] = indicators;

      expect(ind01.app.rows[0]).toMatchObject({
        numerator: 15,
        denominator: 20,
        value: 75,
      });
      expect(ind02.app.rows[0]).toMatchObject({
        numerator: 50,
        denominator: 2,
        value: 25,
      });
      expect(ind03.app.rows[0]).toMatchObject({
        numerator: 3,
        denominator: 4,
        value: 75,
      });
    });

    it('should skip attempts without the metric or with a zero denominator', async () => {
      repository.findExamAttempts.mockResolvedValue([
        buildAttempt({ id: 'a1', theoreticalCorrect: 10, theoreticalTotal: 0 }),
        buildAttempt({
          id: 'a2',
          theoreticalCorrect: null,
          theoreticalTotal: 20,
        }),
        buildAttempt({ id: 'a3', theoreticalCorrect: 0, theoreticalTotal: 20 }),
      ]);

      const { indicators } = await service.getIndicatorsReport();

      // Cero respuestas correctas es una medición válida
      expect(indicators[0].app.rows.map((r) => r.attemptId)).toEqual(['a3']);
      expect(indicators[1].app.rows).toEqual([]);
      expect(indicators[2].app.rows).toEqual([]);
    });

    it('should group attempts by evaluation date into sheet records', async () => {
      repository.findExamAttempts.mockResolvedValue([
        buildAttempt({
          id: 'a1',
          userId: 'u1',
          theoreticalCorrect: 10,
          theoreticalTotal: 20,
          createdAt: new Date('2026-05-01T08:00:00Z'),
          updatedAt: new Date('2026-05-04T08:00:00Z'),
        }),
        buildAttempt({
          id: 'a2',
          userId: 'u2',
          theoreticalCorrect: 20,
          theoreticalTotal: 20,
          createdAt: new Date('2026-05-03T08:00:00Z'),
          updatedAt: new Date('2026-05-04T15:00:00Z'),
        }),
        buildAttempt({
          id: 'a3',
          userId: 'u1',
          theoreticalCorrect: 5,
          theoreticalTotal: 10,
          createdAt: new Date('2026-05-10T08:00:00Z'),
          updatedAt: new Date('2026-05-10T08:00:00Z'),
        }),
      ]);

      const { sheet } = (await service.getIndicatorsReport()).indicators[0];

      expect(sheet.records).toHaveLength(2);
      expect(sheet.records[0]).toEqual({
        id: 'IND-01-2026-05-04',
        itemNumber: 1,
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-05-04'),
        participants: 2,
        numerator: 30,
        denominator: 40,
        value: 75,
      });
      expect(sheet.records[1]).toMatchObject({
        itemNumber: 2,
        participants: 1,
        value: 50,
      });
      expect(sheet.startDate).toEqual(new Date('2026-05-01'));
      expect(sheet.endDate).toEqual(new Date('2026-05-10'));
    });

    it('should weight the sheet total as Σ numerator / Σ denominator', async () => {
      repository.findExamAttempts.mockResolvedValue([
        buildAttempt({
          id: 'a1',
          theoreticalCorrect: 1,
          theoreticalTotal: 10,
          updatedAt: new Date('2026-05-04T00:00:00Z'),
        }),
        buildAttempt({
          id: 'a2',
          theoreticalCorrect: 90,
          theoreticalTotal: 90,
          updatedAt: new Date('2026-05-05T00:00:00Z'),
        }),
      ]);

      const { sheet, app } = (await service.getIndicatorsReport())
        .indicators[0];

      // Promedio simple sería 55%; el ponderado es 91 / 100
      expect(sheet.summary).toEqual({
        periods: 2,
        totalNumerator: 91,
        totalDenominator: 100,
        value: 91,
      });
      expect(app.summary.value).toBe(91);
    });

    it('should use the practical grading date before updatedAt', async () => {
      repository.findExamAttempts.mockResolvedValue([
        buildAttempt({
          practicalTotalMinutes: 30,
          practicalTasksEvaluated: 1,
          practicalGradedAt: new Date('2026-06-01T12:00:00Z'),
          updatedAt: new Date('2026-06-05T12:00:00Z'),
        }),
      ]);

      const ind02 = (await service.getIndicatorsReport()).indicators[1];

      expect(ind02.app.rows[0].date).toEqual(new Date('2026-06-01T12:00:00Z'));
      expect(ind02.sheet.records[0].endDate).toEqual(new Date('2026-06-01'));
    });

    it('should count distinct participants in the app summary', async () => {
      repository.findExamAttempts.mockResolvedValue([
        buildAttempt({
          id: 'a1',
          userId: 'u1',
          theoreticalCorrect: 1,
          theoreticalTotal: 2,
        }),
        buildAttempt({
          id: 'a2',
          userId: 'u1',
          theoreticalCorrect: 2,
          theoreticalTotal: 2,
        }),
        buildAttempt({
          id: 'a3',
          userId: 'u2',
          theoreticalCorrect: 2,
          theoreticalTotal: 2,
        }),
      ]);

      const { summary } = (await service.getIndicatorsReport()).indicators[0]
        .app;

      expect(summary.evaluations).toBe(3);
      expect(summary.participants).toBe(2);
    });

    it('should fall back to the email when the student has no name', async () => {
      repository.findExamAttempts.mockResolvedValue([
        buildAttempt({
          userId: 'u9',
          name: null,
          lastname: null,
          theoreticalCorrect: 1,
          theoreticalTotal: 1,
        }),
      ]);

      const row = (await service.getIndicatorsReport()).indicators[0].app
        .rows[0];

      expect(row.studentName).toBe('u9@mail.com');
    });
  });

  describe('getMyIndicators', () => {
    it('should query only the attempts of the given user', async () => {
      await service.getMyIndicators('user-7');

      expect(repository.findExamAttempts).toHaveBeenCalledWith('user-7');
    });

    it('should return the summary and history of each indicator', async () => {
      repository.findExamAttempts.mockResolvedValue([
        buildAttempt({ theoreticalCorrect: 18, theoreticalTotal: 20 }),
      ]);

      const result = await service.getMyIndicators('user-1');
      const ind01 = result.indicators[0];

      expect(result.variable).toBe(STUDY_VARIABLE);
      expect(ind01).toMatchObject({
        code: 'IND-01',
        evaluations: 1,
        participants: 1,
        totalNumerator: 18,
        totalDenominator: 20,
        value: 90,
      });
      expect(ind01.history).toEqual([
        {
          attemptId: 'attempt-1',
          courseTitle: 'Docker',
          date: new Date('2026-05-04T10:00:00Z'),
          numerator: 18,
          denominator: 20,
          value: 90,
        },
      ]);
      expect(ind01).not.toHaveProperty('baseline');
      expect(ind01).not.toHaveProperty('comparison');
    });

    it('should return null values when the user has no evaluations', async () => {
      const result = await service.getMyIndicators('user-1');

      for (const ind of result.indicators) {
        expect(ind.value).toBeNull();
        expect(ind.history).toEqual([]);
      }
    });
  });
});
