import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  db, 
  auth, 
  collection, 
  doc, 
  getDoc,
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
import { getISOWeek } from './utils';
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

export const getTargetUserId = (): string => {
  const { user, activePatientId } = useAppStore.getState();
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  if (user?.role === 'doctor' && activePatientId) {
    return activePatientId;
  }
  return auth.currentUser.uid;
};

export const firebaseService = {
  async getReadings(filters?: { slot?: string; date?: string; limit?: number; periodId?: number; dateFrom?: string; dateTo?: string }): Promise<Reading[]> {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const targetUid = getTargetUserId();
    const readingsRef = collection(db, 'users', targetUid, 'readings');
    
    let q = query(readingsRef, orderBy('recordedAt', 'desc'));
    
    if (filters?.slot && filters.slot !== 'all') {
      q = query(q, where('slot', '==', filters.slot));
    }
    
    if (filters?.date) {
      q = query(q, where('date', '==', filters.date));
    }

    if (filters?.periodId) {
      q = query(q, where('periodId', '==', filters.periodId));
    }

    if (filters?.dateFrom) {
      q = query(q, where('date', '>=', filters.dateFrom));
    }

    if (filters?.dateTo) {
      q = query(q, where('date', '<=', filters.dateTo));
    }
    
    if (filters?.limit) {
      q = query(q, limit(filters.limit));
    }

    try {
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          recordedAt: data.recordedAt instanceof Timestamp ? data.recordedAt.toDate().toISOString() : data.recordedAt
        } as Reading;
      });

      // Filter by period explicitly if provided (to ensure type safety)
      if (filters?.periodId) {
        return docs.filter(r => Number(r.periodId) === Number(filters.periodId));
      }
      return docs;
    } catch (error) {
      // Fallback: fetch without index if possible
      try {
        const snapshot = await getDocs(readingsRef);
        let results = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            recordedAt: data.recordedAt instanceof Timestamp ? data.recordedAt.toDate().toISOString() : data.recordedAt
          } as Reading;
        }).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));

        if (filters?.slot && filters.slot !== 'all') {
          results = results.filter(r => r.slot === filters.slot);
        }
        if (filters?.date) {
          results = results.filter(r => r.date === filters.date);
        }
        if (filters?.periodId) {
          results = results.filter(r => Number(r.periodId) === Number(filters.periodId));
        }
        if (filters?.dateFrom) {
          results = results.filter(r => r.date >= filters.dateFrom!);
        }
        if (filters?.dateTo) {
          results = results.filter(r => r.date <= filters.dateTo!);
        }
        if (filters?.limit) {
          results = results.slice(0, filters.limit);
        }
        return results;
      } catch (innerError) {
        console.error('Firestore error in getReadings fallback', innerError);
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

    // Calculate weekId
    const weekId = getISOWeek(data.date);

    // Calculate periodId cleanly using native Firebase
    let targetPeriodId = 1;

    try {
      // 1. Get the latest reading based purely on timestamp (already indexed natively)
      const latestQ = query(readingsRef, orderBy('recordedAt', 'desc'), limit(1));
      const latestSnap = await getDocs(latestQ);
      
      if (!latestSnap.empty) {
        const lastReading = latestSnap.docs[0].data() as Reading;
        const currentPeriodId = lastReading.periodId || 1;
        
        // 2. Fetch all readings for ONLY that latest period
        const periodQ = query(readingsRef, where('periodId', '==', currentPeriodId));
        const periodSnap = await getDocs(periodQ);
        const periodReadings = periodSnap.docs.map(d => d.data() as Reading);
        
        const uniqueDates = Array.from(new Set(periodReadings.map(r => r.date)));
        
        // Check temporal gap between the last date in this period and the new date
        const lastDateInPeriod = new Date(lastReading.date);
        const newDate = new Date(data.date);
        const diffDays = Math.ceil((newDate.getTime() - lastDateInPeriod.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 10) {
          // Time gap is large enough to logically break the cycle
          targetPeriodId = currentPeriodId + 1;
        } else if (uniqueDates.length >= 5 && !uniqueDates.includes(data.date)) {
          // This period already has 5 unique days, adding a 6th day creates a new cycle
          targetPeriodId = currentPeriodId + 1;
        } else {
          // We are still within the active 5-day cycle
          targetPeriodId = currentPeriodId;
        }
      }
    } catch (e) {
      console.error("Error evaluating periodId cleanly, fallback to 1", e);
      targetPeriodId = 1;
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
      userUid: auth.currentUser.uid,
      periodId: targetPeriodId,
      weekId
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
      // Remove undefined values to prevent Firestore errors
      const sanitizedData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      );
      await setDoc(userRef, { ...sanitizedData, updatedAt: Timestamp.now() }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      throw error;
    }
  },

  async updateAITokenUsage(tokensUsed: number, totalLimit: number = 50000): Promise<void> {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    try {
      const dbInfoStr = localStorage.getItem('tensiotrack-user');
      const now = new Date();
      let currentTokens = 0;
      let resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(); // 1st of next month

      const store = useAppStore.getState();
      const user = store.user;

      if (user && user.aiUsage) {
        if (new Date(user.aiUsage.resetDate) > now) {
          currentTokens = user.aiUsage.tokensUsed;
          resetDate = user.aiUsage.resetDate;
        }
      }
      
      const newTokens = currentTokens + tokensUsed;
      
      try {
        await setDoc(userRef, {
          aiUsage: {
            tokensUsed: newTokens,
            limit: totalLimit,
            resetDate
          }
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
        throw error;
      }
      
      // We also update local store gently via the app store
      if (store.user) {
        store.setUser({
          ...store.user,
          aiUsage: {
            tokensUsed: newTokens,
            limit: totalLimit,
            resetDate
          }
        });
      }
    } catch (error) {
       console.error("Failed to track AI usage", error);
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
  const { activePatientId } = useAppStore();
  return useQuery<DashboardData>({
    queryKey: ['dashboard', auth.currentUser?.uid, activePatientId],
    enabled: !!auth.currentUser,
    queryFn: async () => {
      // 6-Month Temporal Boundary for Dashboard Performance
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const dateFrom = sixMonthsAgo.toISOString().split('T')[0];

      const allReadings = await firebaseService.getReadings({ dateFrom });

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

      // Group into cycles predictably using actual periodIds which are now guaranteed correct
      const readingsByPeriod: Record<number, Reading[]> = {};
      allReadings.forEach(r => {
        if (!readingsByPeriod[r.periodId!]) readingsByPeriod[r.periodId!] = [];
        readingsByPeriod[r.periodId!].push(r);
      });

      const periods = Object.keys(readingsByPeriod).map(Number).sort((a, b) => b - a);
      
      const cycles = periods.map(pId => {
        const pReadings = readingsByPeriod[pId];
        const pReadingsByDate: Record<string, Record<'morning' | 'evening', Reading[]>> = {};
        
        pReadings.forEach(r => {
          if (!pReadingsByDate[r.date]) pReadingsByDate[r.date] = { morning: [], evening: [] };
          pReadingsByDate[r.date][r.slot].push(r);
        });

        const pDays = Object.entries(pReadingsByDate)
          .sort((a, b) => a[0].localeCompare(b[0])) // Ascending for cycle
          .map(([date, slots]) => {
            const morningAvg = calculateSessionAverage(slots.morning);
            const eveningAvg = calculateSessionAverage(slots.evening);
            return {
              date,
              morningAvg,
              eveningAvg,
              dailyAvg: calculateDayAverage(morningAvg, eveningAvg),
              morningReadingsCount: slots.morning.length,
              eveningReadingsCount: slots.evening.length
            };
          });

      const pAverages = calculatePeriodAverages(pDays);
        const fAverage = calculateFinalPeriodAverage(pAverages.morning, pAverages.evening);

        // Clinical validation: A period is only complete if it has exactly 5 unique days
        // and each of those days has both morning and evening sessions COMPLETED (3 readings each).
        const completedSessionsCount = pDays.reduce((acc, d) => {
          return acc + (d.morningReadingsCount === 3 ? 1 : 0) + (d.eveningReadingsCount === 3 ? 1 : 0);
        }, 0);
        
        // A period should be strictly contiguous (not spanning more than 10-12 total days)
        // to be clinically valid as a "block".
        let isTimeConsistent = false;
        if (pDays.length > 0) {
          const firstDate = new Date(pDays[0].date);
          const lastDate = new Date(pDays[pDays.length - 1].date);
          const spanDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
          isTimeConsistent = spanDays <= 12; // Allow some slack but not weeks
        }

        return {
          startDate: pDays[0]?.date || '',
          endDate: pDays[pDays.length - 1]?.date || '',
          averages: pAverages,
          finalAverage: fAverage,
          days: pDays,
          isComplete: completedSessionsCount >= 10 && isTimeConsistent
        };
      });

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
          avgHeartRate: todayAvg?.heartRate || null,
          sessions: [
            {
              id: 'morning',
              slot: 'morning',
              avgSystolic: todayMorningAvg?.systolic || null,
              avgDiastolic: todayMorningAvg?.diastolic || null,
              avgHeartRate: todayMorningAvg?.heartRate || null,
              completedAt: todaySlots.morning.length === 3 ? todaySlots.morning[0].recordedAt : null,
              readings: todaySlots.morning
            },
            {
              id: 'evening',
              slot: 'evening',
              avgSystolic: todayEveningAvg?.systolic || null,
              avgDiastolic: todayEveningAvg?.diastolic || null,
              avgHeartRate: todayEveningAvg?.heartRate || null,
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
          daysCount: currentCycle?.days.length || 0,
          isComplete: currentCycle?.isComplete || false,
          historicalCycles: cycles.slice(1)
        }
      };
    }
  });
};

export const useAvailablePeriods = () => {
  const { activePatientId } = useAppStore();
  return useQuery<{ id: number; label: string }[]>({
    queryKey: ['availablePeriods', auth.currentUser?.uid, activePatientId],
    enabled: !!auth.currentUser && (useAppStore.getState().user?.role !== 'doctor' || !!activePatientId),
    queryFn: async () => {
      if (!auth.currentUser) return [];
      try {
        const targetUid = getTargetUserId();
        const readingsRef = collection(db, 'users', targetUid, 'readings');
        const snapshot = await getDocs(readingsRef);
        
        const periods = new Set<number>();
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const pid = data.periodId;
          if (pid) {
            periods.add(Number(pid));
          }
        });
        
        const result = Array.from(periods)
          .sort((a, b) => b - a)
          .map(id => ({ id, label: `Período ${id}` }));
        
        console.log("Filtered available periods:", result);
        return result;
      } catch (error) {
        console.error("Error fetching available periods:", error);
        return [];
      }
    }
  });
};

export const useReadings = (filters?: { slot?: string; date?: string; limit?: number; periodId?: number; dateFrom?: string; dateTo?: string }) => {
  const { activePatientId } = useAppStore();
  return useQuery<Reading[]>({
    queryKey: ['readings', auth.currentUser?.uid, activePatientId, filters?.slot, filters?.date, filters?.limit, filters?.periodId, filters?.dateFrom, filters?.dateTo],
    enabled: !!auth.currentUser,
    queryFn: () => firebaseService.getReadings(filters)
  });
};

export const usePatientProfile = (patientId: string | null) => {
  return useQuery({
    queryKey: ['patient-profile', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const docRef = doc(db, 'users', patientId!);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { uid: docSnap.id, ...docSnap.data() };
      }
      return null;
    }
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
        setUser({ 
          ...user, 
          ...variables, 
          updatedAt: new Date().toISOString() 
        });
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
