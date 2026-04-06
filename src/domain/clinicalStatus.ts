export type ClinicalStatus = 'danger' | 'high' | 'warning' | 'normal' | 'low';

/**
 * Clinical status for home blood pressure readings (AMPA context).
 * - danger: hypertensive crisis threshold
 * - high: above AMPA objective
 * - warning: elevated but below AMPA high threshold
 * - normal: within expected range
 * - low: below expected lower range
 */
export const getClinicalStatus = (
  systolic: number,
  diastolic: number
): ClinicalStatus => {
  if (systolic >= 180 || diastolic >= 120) return 'danger';
  if (systolic >= 135 || diastolic >= 85) return 'high';
  if (systolic >= 130 || diastolic >= 80) return 'warning';
  if (systolic < 100 || diastolic < 60) return 'low';
  return 'normal';
};
