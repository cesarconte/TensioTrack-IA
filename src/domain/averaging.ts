export interface Reading {
  systolic: number;
  diastolic: number;
}

export const roundToTenth = (n: number): number => {
  return Math.round(n * 10) / 10;
};

/**
 * Nivel 1 — Promedio de sesión
 */
export const calculateSessionAverage = (readings: Reading[]): Reading | null => {
  if (readings.length !== 3) return null;
  
  const avgSys = readings.reduce((acc, r) => acc + r.systolic, 0) / 3;
  const avgDia = readings.reduce((acc, r) => acc + r.diastolic, 0) / 3;
  
  return {
    systolic: roundToTenth(avgSys),
    diastolic: roundToTenth(avgDia)
  };
};

/**
 * Nivel 2 — Promedio diario
 */
export const calculateDayAverage = (morningAvg: Reading | null, eveningAvg: Reading | null): Reading | null => {
  if (!morningAvg && !eveningAvg) return null;
  if (!morningAvg) return eveningAvg;
  if (!eveningAvg) return morningAvg;
  
  const avgSys = (morningAvg.systolic + eveningAvg.systolic) / 2;
  const avgDia = (morningAvg.diastolic + eveningAvg.diastolic) / 2;
  
  return {
    systolic: roundToTenth(avgSys),
    diastolic: roundToTenth(avgDia)
  };
};

/**
 * Nivel 3 — Promedio de período (5 días)
 */
export const calculatePeriodAverages = (days: { morningAvg: Reading | null, eveningAvg: Reading | null }[]): { morning: Reading | null, evening: Reading | null } => {
  const morningDays = days.filter(d => d.morningAvg !== null).map(d => d.morningAvg!);
  const eveningDays = days.filter(d => d.eveningAvg !== null).map(d => d.eveningAvg!);
  
  const morningResult = morningDays.length > 0 ? {
    systolic: roundToTenth(morningDays.reduce((acc, r) => acc + r.systolic, 0) / morningDays.length),
    diastolic: roundToTenth(morningDays.reduce((acc, r) => acc + r.diastolic, 0) / morningDays.length)
  } : null;
  
  const eveningResult = eveningDays.length > 0 ? {
    systolic: roundToTenth(eveningDays.reduce((acc, r) => acc + r.systolic, 0) / eveningDays.length),
    diastolic: roundToTenth(eveningDays.reduce((acc, r) => acc + r.diastolic, 0) / eveningDays.length)
  } : null;
  
  return {
    morning: morningResult,
    evening: eveningResult
  };
};

/**
 * Nivel 4 — Promedio final del período
 */
export const calculateFinalPeriodAverage = (morningPeriodAvg: Reading | null, eveningPeriodAvg: Reading | null): Reading | null => {
  if (!morningPeriodAvg && !eveningPeriodAvg) return null;
  if (!morningPeriodAvg) return eveningPeriodAvg;
  if (!eveningPeriodAvg) return morningPeriodAvg;
  
  const avgSys = (morningPeriodAvg.systolic + eveningPeriodAvg.systolic) / 2;
  const avgDia = (morningPeriodAvg.diastolic + eveningPeriodAvg.diastolic) / 2;
  
  return {
    systolic: roundToTenth(avgSys),
    diastolic: roundToTenth(avgDia)
  };
};
