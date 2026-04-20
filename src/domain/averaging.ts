export interface Reading {
  systolic: number;
  diastolic: number;
  heartRate?: number | null;
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
  
  const hrReadings = readings.filter(r => r.heartRate !== null && r.heartRate !== undefined);
  const avgHr = hrReadings.length > 0 
    ? hrReadings.reduce((acc, r) => acc + (r.heartRate || 0), 0) / hrReadings.length 
    : null;
  
  return {
    systolic: roundToTenth(avgSys),
    diastolic: roundToTenth(avgDia),
    heartRate: avgHr !== null ? Math.round(avgHr) : null
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
  
  const hrValues = [morningAvg.heartRate, eveningAvg.heartRate].filter(v => v !== null && v !== undefined) as number[];
  const avgHr = hrValues.length > 0 ? hrValues.reduce((acc, v) => acc + v, 0) / hrValues.length : null;
  
  return {
    systolic: roundToTenth(avgSys),
    diastolic: roundToTenth(avgDia),
    heartRate: avgHr !== null ? Math.round(avgHr) : null
  };
};

/**
 * Nivel 3 — Promedio de período (5 días)
 */
export const calculatePeriodAverages = (days: { morningAvg: Reading | null, eveningAvg: Reading | null }[]): { morning: Reading | null, evening: Reading | null } => {
  const morningDays = days.filter(d => d.morningAvg !== null).map(d => d.morningAvg!);
  const eveningDays = days.filter(d => d.eveningAvg !== null).map(d => d.eveningAvg!);
  
  const calculateAvg = (readings: Reading[]) => {
    if (readings.length === 0) return null;
    const sys = roundToTenth(readings.reduce((acc, r) => acc + r.systolic, 0) / readings.length);
    const dia = roundToTenth(readings.reduce((acc, r) => acc + r.diastolic, 0) / readings.length);
    
    const hrValues = readings.filter(r => r.heartRate !== null && r.heartRate !== undefined).map(r => r.heartRate!) as number[];
    const hr = hrValues.length > 0 ? Math.round(hrValues.reduce((acc, v) => acc + v, 0) / hrValues.length) : null;
    
    return { systolic: sys, diastolic: dia, heartRate: hr };
  };
  
  return {
    morning: calculateAvg(morningDays),
    evening: calculateAvg(eveningDays)
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
  
  const hrValues = [morningPeriodAvg.heartRate, eveningPeriodAvg.heartRate].filter(v => v !== null && v !== undefined) as number[];
  const avgHr = hrValues.length > 0 ? hrValues.reduce((acc, v) => acc + v, 0) / hrValues.length : null;
  
  return {
    systolic: roundToTenth(avgSys),
    diastolic: roundToTenth(avgDia),
    heartRate: avgHr !== null ? Math.round(avgHr) : null
  };
};
