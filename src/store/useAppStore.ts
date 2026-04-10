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
    }),
    {
      name: 'tensiotrack-storage',
      partialize: (state) => ({ 
        isDarkMode: state.isDarkMode,
        activeTab: state.activeTab 
      }),
    }
  )
);
