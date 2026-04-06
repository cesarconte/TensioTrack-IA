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
  if (!morningAvg || !eveningAvg) return null;
  
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
  
  // Only calculate if we have exactly 5 days with data (as per requirements)
  if (morningDays.length < 5 || eveningDays.length < 5) {
    return { morning: null, evening: null };
  }
  
  const morningAvgSys = morningDays.reduce((acc, r) => acc + r.systolic, 0) / 5;
  const morningAvgDia = morningDays.reduce((acc, r) => acc + r.diastolic, 0) / 5;
  
  const eveningAvgSys = eveningDays.reduce((acc, r) => acc + r.systolic, 0) / 5;
  const eveningAvgDia = eveningDays.reduce((acc, r) => acc + r.diastolic, 0) / 5;
  
  return {
    morning: {
      systolic: roundToTenth(morningAvgSys),
      diastolic: roundToTenth(morningAvgDia)
    },
    evening: {
      systolic: roundToTenth(eveningAvgSys),
      diastolic: roundToTenth(eveningAvgDia)
    }
  };
};

/**
 * Nivel 4 — Promedio final del período
 */
export const calculateFinalPeriodAverage = (morningPeriodAvg: Reading | null, eveningPeriodAvg: Reading | null): Reading | null => {
  if (!morningPeriodAvg || !eveningPeriodAvg) return null;
  
  const avgSys = (morningPeriodAvg.systolic + eveningPeriodAvg.systolic) / 2;
  const avgDia = (morningPeriodAvg.diastolic + eveningPeriodAvg.diastolic) / 2;
  
  return {
    systolic: roundToTenth(avgSys),
    diastolic: roundToTenth(avgDia)
  };
};
