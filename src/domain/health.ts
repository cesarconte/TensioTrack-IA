/**
 * Medical categorization and formatting logic for blood pressure and pulse.
 * Based on the "Health Status Colors" framework.
 */

export type BloodPressureStatus = 'hypotension' | 'normal' | 'normal-high' | 'hypertension';
export type PulseStatus = 'bradycardia' | 'normal' | 'tachycardia';

interface StatusStyle {
  label: string;
  color: string;
  bg: string;
  hex: string;
}

/**
 * Categorizes blood pressure based on systolic and diastolic values.
 */
export const getBloodPressureStatus = (sys: number, dia: number): BloodPressureStatus => {
  if (sys >= 140 || dia >= 90) return 'hypertension';
  if (sys >= 130 || dia >= 80) return 'normal-high';
  if (sys < 100 || dia < 60) return 'hypotension';
  return 'normal';
};

/**
 * Returns identifying styles and labels for a given blood pressure status.
 */
export const getBloodPressureStyle = (status: BloodPressureStatus): StatusStyle => {
  switch (status) {
    case 'hypotension':
      return {
        label: 'HIPOTENSIÓN',
        color: 'text-[#3B82F6]',
        bg: 'bg-status-hypotension-layer',
        hex: '#3B82F6'
      };
    case 'normal-high':
      return {
        label: 'NORMAL-ALTA',
        color: 'text-[#F59E0B]',
        bg: 'bg-status-normal-high-layer',
        hex: '#F59E0B'
      };
    case 'hypertension':
      return {
        label: 'HIPERTENSIÓN',
        color: 'text-[#E11D48]',
        bg: 'bg-status-hypertension-layer',
        hex: '#E11D48'
      };
    case 'normal':
    default:
      return {
        label: 'NORMAL',
        color: 'text-[#10B981]',
        bg: 'bg-status-normal-layer',
        hex: '#10B981'
      };
  }
};

/**
 * Categorizes pulse rate (lpm).
 */
export const getPulseStatus = (hr: number): PulseStatus => {
  if (hr > 100) return 'tachycardia';
  if (hr < 60) return 'bradycardia';
  return 'normal';
};

/**
 * Returns identifying styles and labels for a given pulse status.
 */
export const getPulseStyle = (status: PulseStatus): StatusStyle => {
  switch (status) {
    case 'bradycardia':
      return {
        label: 'BRADICARDIA',
        color: 'text-[#06B6D4]',
        bg: 'bg-status-bradycardia-layer',
        hex: '#06B6D4'
      };
    case 'tachycardia':
      return {
        label: 'TAQUICARDIA',
        color: 'text-[#EF4444]',
        bg: 'bg-status-tachycardia-layer',
        hex: '#EF4444'
      };
    case 'normal':
    default:
      return {
        label: 'NORMAL',
        color: 'text-[#10B981]',
        bg: 'bg-status-normal-layer',
        hex: '#10B981'
      };
  }
};
