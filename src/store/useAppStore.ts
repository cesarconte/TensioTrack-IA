import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Reading, UserProfile } from '../types';

interface AppState {
  // Auth
  user: UserProfile | null;
  isAuthReady: boolean;
  setUser: (user: UserProfile | null) => void;
  setAuthReady: (ready: boolean) => void;

  // UI State
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  activeTab: 'dashboard' | 'history' | 'report' | 'ai' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'history' | 'report' | 'ai' | 'settings') => void;
  
  // Modals
  isReadingFormOpen: boolean;
  setReadingFormOpen: (open: boolean) => void;
  isInfoModalOpen: boolean;
  setInfoModalOpen: (open: boolean) => void;

  // Editing
  editingReading: Reading | null;
  setEditingReading: (reading: Reading | null) => void;

  // Health Settings
  unitSystem: 'metric' | 'imperial';
  setUnitSystem: (system: 'metric' | 'imperial') => void;
  measurementFrequency: 'daily' | 'weekly' | 'monthly';
  setMeasurementFrequency: (freq: 'daily' | 'weekly' | 'monthly') => void;
  autoBmi: boolean;
  setAutoBmi: (enabled: boolean) => void;
  showTrends: boolean;
  setShowTrends: (show: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthReady: false,
      setUser: (user) => set({ user }),
      setAuthReady: (isAuthReady) => set({ isAuthReady }),

      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      activeTab: 'dashboard',
      setActiveTab: (activeTab) => set({ activeTab }),

      isReadingFormOpen: false,
      setReadingFormOpen: (isReadingFormOpen) => set({ isReadingFormOpen }),
      isInfoModalOpen: false,
      setInfoModalOpen: (isInfoModalOpen) => set({ isInfoModalOpen }),

      editingReading: null,
      setEditingReading: (editingReading) => set({ editingReading }),

      unitSystem: 'metric',
      setUnitSystem: (unitSystem) => set({ unitSystem }),
      measurementFrequency: 'daily',
      setMeasurementFrequency: (measurementFrequency) => set({ measurementFrequency }),
      autoBmi: true,
      setAutoBmi: (autoBmi) => set({ autoBmi }),
      showTrends: true,
      setShowTrends: (showTrends) => set({ showTrends }),
    }),
    {
      name: 'tensiotrack-storage',
      partialize: (state) => ({ 
        isDarkMode: state.isDarkMode,
        activeTab: state.activeTab,
        unitSystem: state.unitSystem,
        measurementFrequency: state.measurementFrequency,
        autoBmi: state.autoBmi,
        showTrends: state.showTrends
      }),
    }
  )
);
