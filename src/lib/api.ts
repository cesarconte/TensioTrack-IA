import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  db, 
  auth, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp, 
  addDoc, 
  deleteDoc, 
  writeBatch,
  handleFirestoreError,
  OperationType,
  limit
} from '../firebase';
import { Reading, DashboardData, UserProfile } from '../types';
import { 
  calculateSessionAverage, 
  calculateDayAverage,
  calculatePeriodAverages, 
  calculateFinalPeriodAverage 
} from '../domain/averaging';
import { categorizeNote } from './categorization';
import { ReadingInput } from './schemas';
import { useAppStore } from '../store/useAppStore';
import { toast } from 'sonner';

// --- Services ---

export const firebaseService = {
  async getReadings(filters?: { slot?: string; date?: string; limit?: number }): Promise<Reading[]> {
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
        let results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          recordedAt: (doc.data().recordedAt as Timestamp).toDate().toISOString()
        } as Reading)).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));

        if (filters?.slot && filters.slot !== 'all') {
          results = results.filter(r => r.slot === filters.slot);
        }
        if (filters?.date) {
          results = results.filter(r => r.date === filters.date);
        }
        if (filters?.limit) {
          results = results.slice(0, filters.limit);
        }
        return results;
      } catch (e) {
        console.error('Firestore error in getReadings', e);
        return [];
      }
    }
  },

  async addReading(data: ReadingInput): Promise<Reading> {
    if (!auth.currentUser) throw new Error('User not authenticated');
    
    const readingsRef = collection(db, 'users', auth.currentUser.uid, 'readings');
    
    // Check count for this session
    const q = query(readingsRef, where('date', '==', data.date), where('slot', '==', data.slot));
    const snapshot = await getDocs(q);
    if (snapshot.size >= 3) {
      throw new Error('La sesión ya tiene 3 lecturas (Protocolo AMPA)');
    }

    const newReading = {
      systolic: data.systolic,
      diastolic: data.diastolic,
      heartRate: data.heartRate || null,
      order: snapshot.size + 1,
      slot: data.slot,
      date: data.date,
      notes: data.notes || null,
      category: await categorizeNote(data.notes || undefined),
      recordedAt: Timestamp.now(),
      userUid: auth.currentUser.uid
    };

    try {
      const docRef = await addDoc(readingsRef, newReading);
      return { 
        id: docRef.id, 
        ...newReading, 
        recordedAt: new Date().toISOString() 
      } as Reading;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${auth.currentUser.uid}/readings`);
      throw error;
    }
  },

  async deleteReading(id: string): Promise<string> {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const readingRef = doc(db, 'users', auth.currentUser.uid, 'readings', id);
    try {
      await deleteDoc(readingRef);
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${auth.currentUser.uid}/readings/${id}`);
      throw error;
    }
  },

  async clearAllData(): Promise<void> {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const readingsRef = collection(db, 'users', auth.currentUser.uid, 'readings');
    const snapshot = await getDocs(readingsRef);
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  },

  async updateUserProfile(data: Partial<UserProfile>): Promise<void> {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const userRef = doc(db, 'users', auth.currentUser.uid);
    try {
      await setDoc(userRef, data, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      throw error;
    }
  },

  async deleteAccount(): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const uid = user.uid;
    const batch = writeBatch(db);

    // 1. Delete all readings
    const readingsRef = collection(db, 'users', uid, 'readings');
    const readingsSnapshot = await getDocs(readingsRef);
    readingsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // 2. Delete user profile document
    const userRef = doc(db, 'users', uid);
    batch.delete(userRef);

    try {
      // Execute Firestore deletions
      await batch.commit();

      // 3. Delete from Firebase Auth
      await user.delete();
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }
};

// --- Hooks ---

export const useDashboard = () => {
  return useQuery<DashboardData>({
    queryKey: ['dashboard', auth.currentUser?.uid],
    enabled: !!auth.currentUser,
    queryFn: async () => {
      const allReadings = await firebaseService.getReadings();

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
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([date, slots]) => {
          const morningAvg = calculateSessionAverage(slots.morning);
          const eveningAvg = calculateSessionAverage(slots.evening);
          return {
            date,
            morningAvg,
            eveningAvg,
            dailyAvg: calculateDayAverage(morningAvg, eveningAvg)
          };
        });

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

      // Calculate recent daily averages for the chart (last 14 days with data)
      const recentDailyAverages = Object.entries(readingsByDate)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 14)
        .map(([date, slots]) => {
          const allDayReadings = [...slots.morning, ...slots.evening];
          if (allDayReadings.length === 0) return null;
          
          const sysSum = allDayReadings.reduce((sum, r) => sum + r.systolic, 0);
          const diaSum = allDayReadings.reduce((sum, r) => sum + r.diastolic, 0);
          const hrReadings = allDayReadings.filter(r => r.heartRate !== null);
          const hrSum = hrReadings.reduce((sum, r) => sum + (r.heartRate || 0), 0);
          
          return {
            date,
            systolic: Math.round(sysSum / allDayReadings.length),
            diastolic: Math.round(diaSum / allDayReadings.length),
            heartRate: hrReadings.length > 0 ? Math.round(hrSum / hrReadings.length) : 0
          };
        })
        .filter(Boolean) as { date: string; systolic: number; diastolic: number; heartRate: number; }[];

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
        recentDailyAverages,
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

export const useReadings = (filters?: { slot?: string; date?: string; limit?: number }) => {
  return useQuery<Reading[]>({
    queryKey: ['readings', auth.currentUser?.uid, filters?.slot, filters?.date, filters?.limit],
    enabled: !!auth.currentUser,
    queryFn: () => firebaseService.getReadings(filters)
  });
};

export const useAddReading = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: firebaseService.addReading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

export const useDeleteReading = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: firebaseService.deleteReading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

export const useClearData = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: firebaseService.clearAllData,
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
        category: await categorizeNote(data.notes || undefined),
      };
      await setDoc(readingRef, updatedData, { merge: true });
      return { id: data.id, ...updatedData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  const { setUser, user } = useAppStore();
  
  return useMutation({
    mutationFn: firebaseService.updateUserProfile,
    onSuccess: (_, variables) => {
      if (user) {
        setUser({ ...user, ...variables });
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success("Perfil actualizado correctamente");
    },
    onError: () => {
      toast.error("Error al actualizar el perfil");
    }
  });
};

export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: firebaseService.deleteAccount,
    onSuccess: () => {
      toast.success("Cuenta eliminada correctamente");
    },
    onError: (error: any) => {
      console.error("Error deleting account:", error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error("Por seguridad, debes haber iniciado sesión recientemente para eliminar tu cuenta. Por favor, cierra sesión e inicia sesión de nuevo.");
      } else {
        toast.error("Error al eliminar la cuenta");
      }
    }
  });
};
