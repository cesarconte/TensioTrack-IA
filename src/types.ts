export interface Reading {
  id: string;
  systolic: number;
  diastolic: number;
  heartRate: number | null;
  order: number;
  recordedAt: string;
  date: string;
  slot: 'morning' | 'evening';
  notes: string | null;
  category: string | null;
  userUid: string;
}

export interface Average {
  systolic: number;
  diastolic: number;
}

export interface DayStats {
  date: string;
  morningAvg: Average | null;
  eveningAvg: Average | null;
  dailyAvg: Average | null;
}

export interface PeriodAverages {
  morning: Average | null;
  evening: Average | null;
}

export interface Cycle {
  startDate: string;
  endDate: string;
  averages: PeriodAverages;
  finalAverage: Average | null;
  days: DayStats[];
}

export interface DashboardData {
  today: {
    id: string;
    date: string;
    avgSystolic: number | null;
    avgDiastolic: number | null;
    sessions: {
      id: string;
      slot: 'morning' | 'evening';
      avgSystolic: number | null;
      avgDiastolic: number | null;
      completedAt: string | null;
      readings: Reading[];
    }[];
  } | null;
  recentReadings: Reading[];
  recentDailyAverages: {
    date: string;
    systolic: number;
    diastolic: number;
    heartRate: number;
  }[];
  stats: {
    periodAverages: PeriodAverages;
    finalAverage: Average | null;
    periodDays: DayStats[];
    daysCount: number;
    isComplete: boolean;
    historicalCycles: Cycle[];
  };
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: any;
  // Health Data
  age?: number;
  sex?: 'male' | 'female' | 'other';
  height?: number; // in cm
  weight?: number; // in kg
  isSmoker?: boolean;
  hasDiabetes?: boolean;
  isHypertensiveMedicated?: boolean;
  activityLevel?: 'sedentary' | 'moderate' | 'active';
  alcoholConsumption?: 'none' | 'occasional' | 'frequent';
  saltIntake?: 'low' | 'normal' | 'high';
  stressLevel?: 'low' | 'moderate' | 'high';
  sleepQuality?: 'good' | 'average' | 'poor';
  familyHistory?: boolean;
  caffeineIntake?: 'none' | 'low' | 'moderate' | 'high';
  hasHighCholesterol?: boolean;
  hasKidneyDisease?: boolean;
}
