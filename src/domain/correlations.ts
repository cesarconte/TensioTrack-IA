export interface Reading {
  systolic: number;
  diastolic: number;
  notes?: string | null;
  category?: string | null;
}

export type Correlation = {
  category: string;
  avgSystolic: number;
  avgDiastolic: number;
  count: number;
  impact: number; // Difference from overall average
};

export const calculateCorrelations = (readings: Reading[], overallAvg: { systolic: number; diastolic: number }): Correlation[] => {
  const categorized: Record<string, Reading[]> = {};

  readings.forEach(r => {
    if (r.category) {
      if (!categorized[r.category]) categorized[r.category] = [];
      categorized[r.category].push(r);
    }
  });

  return Object.entries(categorized).map(([category, readings]) => {
    const avgSys = readings.reduce((acc, r) => acc + r.systolic, 0) / readings.length;
    const avgDia = readings.reduce((acc, r) => acc + r.diastolic, 0) / readings.length;
    
    return {
      category,
      avgSystolic: Math.round(avgSys * 10) / 10,
      avgDiastolic: Math.round(avgDia * 10) / 10,
      count: readings.length,
      impact: Math.round((avgSys - overallAvg.systolic) * 10) / 10
    };
  }).filter(c => c.count >= 3); // Only show significant correlations
};
