// Indicadores de la variable dependiente "Aprendizaje teórico y práctico del
// despliegue de servicios web en escenarios de producción" (fichas de registro, tesis).

export const TEST_TYPES = ['PRE_TEST', 'POST_TEST'] as const;
export type TestType = (typeof TEST_TYPES)[number];

export const TEST_TYPE_LABELS: Record<TestType, string> = {
  PRE_TEST: 'Pre-Test',
  POST_TEST: 'Post-Test',
};

export const INDICATOR_CODES = ['IND-01', 'IND-02', 'IND-03'] as const;
export type IndicatorCode = (typeof INDICATOR_CODES)[number];

export const DEFAULT_COMPANY = 'Native Lab S.A.C.';
export const STUDY_VARIABLE =
  'Aprendizaje teórico y práctico del despliegue de servicios web en escenarios de producción';

export interface IndicatorDefinition {
  code: IndicatorCode;
  number: number;
  dimension: string;
  name: string;
  measure: string;
  unit: '%' | 'min';
  formula: string;
  numeratorLabel: string;
  denominatorLabel: string;
  // Factor aplicado a numerador / denominador: 100 para porcentajes, 1 para promedios
  multiplier: number;
  // Sentido de mejora: 'higher' = un valor mayor es mejor, 'lower' = un valor menor es mejor
  betterWhen: 'higher' | 'lower';
}

export const INDICATOR_DEFINITIONS: readonly IndicatorDefinition[] = [
  {
    code: 'IND-01',
    number: 1,
    dimension: 'Comprensión teórica',
    name: 'Porcentaje de respuestas correctas en evaluación teórica',
    measure: 'Razón / Porcentaje (0% - 100%)',
    unit: '%',
    formula: 'Valor = (Respuestas correctas / Total de ítems) × 100',
    numeratorLabel: 'Total de respuestas correctas',
    denominatorLabel: 'Total de ítems evaluados',
    multiplier: 100,
    betterWhen: 'higher',
  },
  {
    code: 'IND-02',
    number: 2,
    dimension: 'Desempeño práctico',
    name: 'Tiempo promedio de resolución y despliegue de servicio',
    measure: 'Razón (minutos)',
    unit: 'min',
    formula: 'Valor = Tiempo total acumulado (min) / Tareas evaluadas (n)',
    numeratorLabel: 'Tiempo total acumulado (min)',
    denominatorLabel: 'Tareas evaluadas (n)',
    multiplier: 1,
    betterWhen: 'lower',
  },
  {
    code: 'IND-03',
    number: 3,
    dimension: 'Desempeño práctico',
    name: 'Tasa de resolución de incidencias inyectadas',
    measure: 'Razón / Porcentaje (0% - 100%)',
    unit: '%',
    formula: 'Valor = (Incidencias resueltas / Total inyectadas) × 100',
    numeratorLabel: 'Incidencias resueltas',
    denominatorLabel: 'Incidencias inyectadas',
    multiplier: 100,
    betterWhen: 'higher',
  },
];

export function findIndicatorDefinition(
  code: string,
): IndicatorDefinition | undefined {
  return INDICATOR_DEFINITIONS.find((d) => d.code === code);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Aplica la fórmula de la ficha: (numerador / denominador) × multiplicador. */
export function computeIndicatorValue(
  definition: IndicatorDefinition,
  numerator: number,
  denominator: number,
): number | null {
  if (!denominator || denominator <= 0) return null;
  return round2((numerator / denominator) * definition.multiplier);
}

/**
 * Compara pre-test vs post-test. La mejora relativa respeta el sentido del
 * indicador (en IND-02 una reducción de tiempo es una mejora).
 */
export function compareIndicator(
  definition: IndicatorDefinition,
  pre: number | null,
  post: number | null,
) {
  if (pre === null || post === null) {
    return {
      pre,
      post,
      absoluteChange: null,
      relativeImprovement: null,
      improved: null,
    };
  }
  const absoluteChange = round2(post - pre);
  const gain = definition.betterWhen === 'higher' ? post - pre : pre - post;
  return {
    pre,
    post,
    absoluteChange,
    relativeImprovement: pre !== 0 ? round2((gain / pre) * 100) : null,
    improved: gain > 0,
  };
}
