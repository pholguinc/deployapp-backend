import {
  INDICATOR_CODES,
  INDICATOR_DEFINITIONS,
  computeIndicatorValue,
  findIndicatorDefinition,
  round2,
} from '../constants/indicator-definitions';

describe('indicator-definitions', () => {
  it('should define one indicator per code', () => {
    expect(INDICATOR_DEFINITIONS.map((d) => d.code)).toEqual([
      ...INDICATOR_CODES,
    ]);
  });

  it('should use x100 for percentages and x1 for minutes', () => {
    for (const definition of INDICATOR_DEFINITIONS) {
      expect(definition.multiplier).toBe(definition.unit === '%' ? 100 : 1);
    }
  });

  describe('findIndicatorDefinition', () => {
    it('should return the definition for a valid code', () => {
      expect(findIndicatorDefinition('IND-02')?.unit).toBe('min');
    });

    it('should return undefined for an unknown code', () => {
      expect(findIndicatorDefinition('IND-99')).toBeUndefined();
    });
  });

  describe('round2', () => {
    it('should round to two decimals', () => {
      expect(round2(41.999)).toBe(42);
      expect(round2(12.345678)).toBe(12.35);
    });
  });

  describe('computeIndicatorValue', () => {
    const ind01 = findIndicatorDefinition('IND-01')!;
    const ind02 = findIndicatorDefinition('IND-02')!;

    it('should apply (numerator / denominator) x 100 for percentages', () => {
      expect(computeIndicatorValue(ind01, 1071, 2550)).toBe(42);
    });

    it('should apply numerator / denominator for minutes', () => {
      expect(computeIndicatorValue(ind02, 8840, 340)).toBe(26);
    });

    it('should return null when the denominator is zero or negative', () => {
      expect(computeIndicatorValue(ind01, 10, 0)).toBeNull();
      expect(computeIndicatorValue(ind01, 10, -5)).toBeNull();
    });
  });
});
