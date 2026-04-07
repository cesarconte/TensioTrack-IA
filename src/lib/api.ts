import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  db, 
  auth, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp, 
  addDoc, 
  deleteDoc, 
  writeBatch,
  handleFirestoreError,
  OperationType,
  limit
} from '../firebase';

export interface Reading {
  id: string;
  systolic: number;
  diastolic: number;
  heartRate?: number;
  order: number;
  recordedAt: string;
  date: string;
  slot: 'morning' | 'evening';
  notes?: string;
  userUid: string;
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
  stats: {
    periodAverages: {
      morning: { systolic: number; diastolic: number } | null;
      evening: { systolic: number; diastolic: number } | null;
    };
    finalAverage: { systolic: number; diastolic: number } | null;
    periodDays: {
      date: string;
      morningAvg: { systolic: number; diastolic: number } | null;
      eveningAvg: { systolic: number; diastolic: number } | null;
    }[];
    daysCount: number;
    isComplete: boolean;
    historicalCycles: {
      startDate: string;
      endDate: string;
      averages: {
        morning: { systolic: number; diastolic: number } | null;
        evening: { systolic: number; diastolic: number } | null;
      };
      finalAverage: { systolic: number; diastolic: number } | null;
      days: {
        date: string;
        morningAvg: { systolic: number; diastolic: number } | null;
        eveningAvg: { systolic: number; diastolic: number } | null;
      }[];
    }[];
  };
}

import { 
  calculateSessionAverage, 
  calculateDayAverage,
  calculatePeriodAverages, 
  calculateFinalPeriodAverage 
} from '../domain/averaging';

export const useDashboard = () => {
  return useQuery<DashboardData>({
    queryKey: ['dashboard', auth.currentUser?.uid],
    enabled: !!auth.currentUser,
    queryFn: async () => {
      if (!auth.currentUser) throw new Error('User not authenticated');
      
      const readingsRef = collection(db, 'users', auth.currentUser.uid, 'readings');
      const q = query(readingsRef, orderBy('recordedAt', 'desc'));
      
      let allReadings: Reading[] = [];
      try {
        const snapshot = await getDocs(q);
        allReadings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          recordedAt: (doc.data().recordedAt as Timestamp).toDate().toISOString()
        } as Reading));
      } catch (error) {
        // Fallback: fetch without index if possible
        try {
          const snapshot = await getDocs(readingsRef);
          allReadings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            recordedAt: (doc.data().recordedAt as Timestamp).toDate().toISOString()
          } as Reading)).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
          
          console.warn('Firestore index error, using in-memory sort fallback', error);
        } catch (e) {
          // If the simple fetch also fails, it's likely a permission error.
          // We log it and return an empty state to avoid crashing the app.
          console.error('Firestore permission or network error', e);
          // Only throw if we really can't return anything useful
          // But for a dashboard, an empty state is better than a crash
          allReadings = [];
        }
      }

      // Group readings by date and slot
      const readingsByDate: Record<string, Record<'morning' | 'evening', Reading[]>> = {};
      allReadings.forEach(r => {
        if (!readingsByDate[r.date]) {
          readingsByDate[r.date] = { morning: [], evening: [] };
        }
        readingsByDate[r.date][r.slot].push(r);
      });

      // Find complete days (3 readings in both morning and evening)
      const completeDays = Object.entries(readingsByDate)
        .filter(([_, slots]) => slots.morning.length === 3 && slots.evening.length === 3)
        .sort((a, b) => b[0].localeCompare(a[0])) // Sort by date desc
        .map(([date, slots]) => ({
          date,
          morningAvg: calculateSessionAverage(slots.morning),
          eveningAvg: calculateSessionAverage(slots.evening)
        }));

      // Group into cycles of 5 days
      const cycles = [];
      for (let i = 0; i < completeDays.length; i += 5) {
        const cycleDays = completeDays.slice(i, i + 5);
        if (cycleDays.length === 0) continue;

        const pAverages = calculatePeriodAverages(cycleDays);
        const fAverage = calculateFinalPeriodAverage(pAverages.morning, pAverages.evening);

        cycles.push({
          startDate: cycleDays[cycleDays.length - 1].date,
          endDate: cycleDays[0].date,
          averages: pAverages,
          finalAverage: fAverage,
          days: cycleDays
        });
      }

      const currentCycle = cycles[0] || null;
      const todayStr = new Date().toISOString().split('T')[0];
      const todaySlots = readingsByDate[todayStr] || { morning: [], evening: [] };
      
      const todayMorningAvg = calculateSessionAverage(todaySlots.morning);
      const todayEveningAvg = calculateSessionAverage(todaySlots.evening);
      const todayAvg = calculateDayAverage(todayMorningAvg, todayEveningAvg);

      return {
        today: {
          id: todayStr,
          date: todayStr,
          avgSystolic: todayAvg?.systolic || null,
          avgDiastolic: todayAvg?.diastolic || null,
          sessions: [
            {
              id: 'morning',
              slot: 'morning',
              avgSystolic: todayMorningAvg?.systolic || null,
              avgDiastolic: todayMorningAvg?.diastolic || null,
              completedAt: todaySlots.morning.length === 3 ? todaySlots.morning[0].recordedAt : null,
              readings: todaySlots.morning
            },
            {
              id: 'evening',
              slot: 'evening',
              avgSystolic: todayEveningAvg?.systolic || null,
              avgDiastolic: todayEveningAvg?.diastolic || null,
              completedAt: todaySlots.evening.length === 3 ? todaySlots.evening[0].recordedAt : null,
              readings: todaySlots.evening
            }
          ]
        },
        recentReadings: allReadings.slice(0, 20),
        stats: {
          periodAverages: currentCycle?.averages || { morning: null, evening: null },
          finalAverage: currentCycle?.finalAverage || null,
          periodDays: currentCycle?.days || [],
          daysCount: completeDays.length % 5 || (completeDays.length > 0 ? 5 : 0),
          isComplete: completeDays.length >= 5,
          historicalCycles: cycles.slice(1)
        }
      };
    }
  });
};

export const useClearData = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!auth.currentUser) throw new Error('User not authenticated');
      const readingsRef = collection(db, 'users', auth.currentUser.uid, 'readings');
      const snapshot = await getDocs(readingsRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

export const useReadings = (filters?: { slot?: string; date?: string; limit?: number }) => {
  return useQuery<Reading[]>({
    queryKey: ['readings', auth.currentUser?.uid, filters?.slot, filters?.date, filters?.limit],
    enabled: !!auth.currentUser,
    queryFn: async () => {
      if (!auth.currentUser) throw new Error('User not authenticated');
      const readingsRef = collection(db, 'users', auth.currentUser.uid, 'readings');
      
      let q = query(readingsRef, orderBy('recordedAt', 'desc'));
      
      if (filters?.slot && filters.slot !== 'all') {
        q = query(q, where('slot', '==', filters.slot));
      }
      
      if (filters?.date) {
        q = query(q, where('date', '==', filters.date));
      }
      
      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      } else if (!filters?.date) {
        // Default limit if no date filter (to keep it "recent")
        q = query(q, limit(50));
      }

      try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          recordedAt: (doc.data().recordedAt as Timestamp).toDate().toISOString()
        } as Reading));
      } catch (error) {
        // Fallback: fetch without index if possible
        try {
          const snapshot = await getDocs(readingsRef);
          return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            recordedAt: (doc.data().recordedAt as Timestamp).toDate().toISOString()
          } as Reading)).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)).slice(0, 50);
        } catch (e) {
          console.error('Firestore permission or network error in useReadings', e);
          return [];
        }
      }
    }
  });
};

export const useAddReading = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { systolic: number; diastolic: number; heartRate?: number; slot: 'morning' | 'evening'; date?: string; notes?: string }) => {
      if (!auth.currentUser) throw new Error('User not authenticated');
      
      const dateStr = data.date || new Date().toISOString().split('T')[0];
      const readingsRef = collection(db, 'users', auth.currentUser.uid, 'readings');
      
      // Check count for this session
      const q = query(readingsRef, where('date', '==', dateStr), where('slot', '==', data.slot));
      const snapshot = await getDocs(q);
      if (snapshot.size >= 3) {
        throw new Error('Session already has 3 readings');
      }

      const newReading = {
        systolic: data.systolic,
        diastolic: data.diastolic,
        heartRate: data.heartRate || null,
        order: snapshot.size + 1,
        slot: data.slot,
        date: dateStr,
        notes: data.notes || null,
        recordedAt: Timestamp.now(),
        userUid: auth.currentUser.uid
      };

      try {
        const docRef = await addDoc(readingsRef, newReading);
        return { id: docRef.id, ...newReading, recordedAt: new Date().toISOString() };
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${auth.currentUser.uid}/readings`);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

export const useUpdateReading = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: string; systolic: number; diastolic: number; heartRate?: number; notes?: string }) => {
      if (!auth.currentUser) throw new Error('User not authenticated');
      
      const readingRef = doc(db, 'users', auth.currentUser.uid, 'readings', data.id);
      
      const updatedData = {
        systolic: data.systolic,
        diastolic: data.diastolic,
        heartRate: data.heartRate || null,
        notes: data.notes || null,
      };

      try {
        await setDoc(readingRef, updatedData, { merge: true });
        return { id: data.id, ...updatedData };
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}/readings/${data.id}`);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};
