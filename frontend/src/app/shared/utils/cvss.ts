/**
 * Motor de cálculo CVSS 3.1 (métricas Base) — implementa la especificación oficial de FIRST.org
 * https://www.first.org/cvss/v3.1/specification-document
 */

export type CvssMetricKey = 'AV' | 'AC' | 'PR' | 'UI' | 'S' | 'C' | 'I' | 'A';

export interface CvssMetricOption {
  key: string;
  label: string;
}

export interface CvssMetricGroup {
  key: CvssMetricKey;
  label: string;
  options: CvssMetricOption[];
}

export const CVSS_METRIC_ORDER: CvssMetricKey[] = ['AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A'];

export const CVSS_METRIC_GROUPS: CvssMetricGroup[] = [
  {
    key: 'AV', label: 'Vector de Ataque', options: [
      { key: 'N', label: 'Red' },
      { key: 'A', label: 'Adyacente' },
      { key: 'L', label: 'Local' },
      { key: 'P', label: 'Físico' },
    ]
  },
  {
    key: 'AC', label: 'Complejidad de Ataque', options: [
      { key: 'L', label: 'Baja' },
      { key: 'H', label: 'Alta' },
    ]
  },
  {
    key: 'PR', label: 'Privilegios Requeridos', options: [
      { key: 'N', label: 'Ninguno' },
      { key: 'L', label: 'Bajos' },
      { key: 'H', label: 'Altos' },
    ]
  },
  {
    key: 'UI', label: 'Interacción del Usuario', options: [
      { key: 'N', label: 'Ninguna' },
      { key: 'R', label: 'Requerida' },
    ]
  },
  {
    key: 'S', label: 'Alcance', options: [
      { key: 'U', label: 'Sin Cambios' },
      { key: 'C', label: 'Cambiado' },
    ]
  },
  {
    key: 'C', label: 'Confidencialidad', options: [
      { key: 'N', label: 'Ninguno' },
      { key: 'L', label: 'Bajo' },
      { key: 'H', label: 'Alto' },
    ]
  },
  {
    key: 'I', label: 'Integridad', options: [
      { key: 'N', label: 'Ninguno' },
      { key: 'L', label: 'Bajo' },
      { key: 'H', label: 'Alto' },
    ]
  },
  {
    key: 'A', label: 'Disponibilidad', options: [
      { key: 'N', label: 'Ninguno' },
      { key: 'L', label: 'Bajo' },
      { key: 'H', label: 'Alto' },
    ]
  },
];

export type CvssMetrics = Partial<Record<CvssMetricKey, string>>;

export type CvssSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export interface CvssResult {
  score: number;
  severity: CvssSeverity;
  vector: string;
}

/** Formatea el score a 1 decimal fijo (ej. 5 -> "5.0") para que el campo manual de CVSS Score
 *  siempre coincida con el estilo mostrado por la calculadora, sin importar dónde se setee. */
export function formatCvssScore(score: number | undefined | null): string | undefined {
  return score === undefined || score === null || isNaN(score) ? undefined : score.toFixed(1);
}

const AV_VALUES: Record<string, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
const AC_VALUES: Record<string, number> = { L: 0.77, H: 0.44 };
const PR_VALUES_UNCHANGED: Record<string, number> = { N: 0.85, L: 0.62, H: 0.27 };
const PR_VALUES_CHANGED: Record<string, number> = { N: 0.85, L: 0.68, H: 0.5 };
const UI_VALUES: Record<string, number> = { N: 0.85, R: 0.62 };
const CIA_VALUES: Record<string, number> = { N: 0, L: 0.22, H: 0.56 };

/** Función de redondeo oficial CVSS 3.1 (roundup a 1 decimal, no es un Math.round estándar) */
function roundUp(input: number): number {
  const intInput = Math.round(input * 100000);
  if (intInput % 10000 === 0) {
    return intInput / 100000;
  }
  return (Math.floor(intInput / 10000) + 1) / 10;
}

export function isMetricsComplete(metrics: CvssMetrics): boolean {
  return CVSS_METRIC_ORDER.every(key => !!metrics[key]);
}

export function severityFromScore(score: number): CvssSeverity {
  if (score <= 0) return 'INFORMATIONAL';
  if (score < 4) return 'LOW';
  if (score < 7) return 'MEDIUM';
  if (score < 9) return 'HIGH';
  return 'CRITICAL';
}

export function calculateCvss31(metrics: CvssMetrics): CvssResult | null {
  if (!isMetricsComplete(metrics)) return null;

  const scopeChanged = metrics.S === 'C';
  const av = AV_VALUES[metrics.AV!];
  const ac = AC_VALUES[metrics.AC!];
  const pr = (scopeChanged ? PR_VALUES_CHANGED : PR_VALUES_UNCHANGED)[metrics.PR!];
  const ui = UI_VALUES[metrics.UI!];
  const c = CIA_VALUES[metrics.C!];
  const i = CIA_VALUES[metrics.I!];
  const a = CIA_VALUES[metrics.A!];

  const iscBase = 1 - ((1 - c) * (1 - i) * (1 - a));
  const isc = scopeChanged
    ? 7.52 * (iscBase - 0.029) - 3.25 * Math.pow(iscBase - 0.02, 15)
    : 6.42 * iscBase;

  const exploitability = 8.22 * av * ac * pr * ui;

  let score: number;
  if (isc <= 0) {
    score = 0;
  } else if (scopeChanged) {
    score = roundUp(Math.min(1.08 * (isc + exploitability), 10));
  } else {
    score = roundUp(Math.min(isc + exploitability, 10));
  }

  const vector = 'CVSS:3.1/' + CVSS_METRIC_ORDER.map(key => `${key}:${metrics[key]}`).join('/');

  return { score, severity: severityFromScore(score), vector };
}

/** Reconstruye las métricas seleccionadas a partir de un vector CVSS 3.1 ya guardado (modo edición) */
export function parseCvssVector(vector?: string | null): CvssMetrics | null {
  if (!vector) return null;
  const parts = vector.split('/').filter(p => p && !p.startsWith('CVSS:'));
  const metrics: CvssMetrics = {};
  for (const part of parts) {
    const [key, value] = part.split(':');
    if (key && value && (CVSS_METRIC_ORDER as string[]).includes(key)) {
      (metrics as any)[key] = value;
    }
  }
  return isMetricsComplete(metrics) ? metrics : null;
}
