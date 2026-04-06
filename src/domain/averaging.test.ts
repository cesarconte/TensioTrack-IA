import { describe, it, expect } from 'vitest';
import { 
  calculateSessionAverage, 
  calculateDayAverage, 
  calculatePeriodAverages, 
  calculateFinalPeriodAverage 
} from './averaging';

describe('Averaging Logic (AMPA Protocol)', () => {
  
  it('should calculate session average correctly (Level 1)', () => {
    const readings = [
      { systolic: 120, diastolic: 80 },
      { systolic: 122, diastolic: 82 },
      { systolic: 118, diastolic: 78 }
    ];
    const result = calculateSessionAverage(readings);
    expect(result).toEqual({ systolic: 120, diastolic: 80 });
  });

  it('should return null if session has less than 3 readings', () => {
    const readings = [
      { systolic: 120, diastolic: 80 },
      { systolic: 122, diastolic: 82 }
    ];
    const result = calculateSessionAverage(readings);
    expect(result).toBeNull();
  });

  it('should calculate day average correctly (Level 2)', () => {
    const morning = { systolic: 120, diastolic: 80 };
    const evening = { systolic: 130, diastolic: 90 };
    const result = calculateDayAverage(morning, evening);
    expect(result).toEqual({ systolic: 125, diastolic: 85 });
  });

  it('should calculate period averages correctly (Level 3)', () => {
    const days = Array(5).fill({
      morningAvg: { systolic: 120, diastolic: 80 },
      eveningAvg: { systolic: 130, diastolic: 90 }
    });
    const result = calculatePeriodAverages(days);
    expect(result.morning).toEqual({ systolic: 120, diastolic: 80 });
    expect(result.evening).toEqual({ systolic: 130, diastolic: 90 });
  });

  it('should calculate final period average correctly (Level 4)', () => {
    const morningPeriod = { systolic: 120, diastolic: 80 };
    const eveningPeriod = { systolic: 130, diastolic: 90 };
    const result = calculateFinalPeriodAverage(morningPeriod, eveningPeriod);
    expect(result).toEqual({ systolic: 125, diastolic: 85 });
  });

  it('should handle rounding to one decimal', () => {
    const readings = [
      { systolic: 120, diastolic: 80 },
      { systolic: 121, diastolic: 81 },
      { systolic: 121, diastolic: 81 }
    ];
    // (120+121+121)/3 = 120.666... -> 120.7
    const result = calculateSessionAverage(readings);
    expect(result?.systolic).toBe(120.7);
  });
});
