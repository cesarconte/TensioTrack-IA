export const kgToLb = (kg: number): number => kg * 2.20462;
export const lbToKg = (lb: number): number => lb / 2.20462;
export const cmToIn = (cm: number): number => cm / 2.54;
export const inToCm = (inches: number): number => inches * 2.54;

export const calculateBMI = (weight: number, height: number, unitSystem: 'metric' | 'imperial'): number => {
  if (weight <= 0 || height <= 0) return 0;
  
  let weightKg = weight;
  let heightM = height / 100;
  
  if (unitSystem === 'imperial') {
    weightKg = lbToKg(weight);
    heightM = inToCm(height) / 100;
  }
  
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
};

export const getBMICategory = (bmi: number): { label: string; color: string } => {
  if (bmi < 18.5) return { label: 'Bajo peso', color: 'text-info' };
  if (bmi < 25) return { label: 'Normal', color: 'text-success' };
  if (bmi < 30) return { label: 'Sobrepeso', color: 'text-warning' };
  return { label: 'Obesidad', color: 'text-destructive' };
};
