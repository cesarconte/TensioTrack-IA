import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from './store/useAppStore';
import { useAuth } from './hooks/useAuth';
import { useDashboard, useReadings } from './lib/api';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/dashboard/Dashboard';
import { History } from './components/dashboard/History';
import { MedicalReport } from './components/MedicalReport';
import { AIPredictions } from './components/AIPredictions';
import { ReadingForm } from './components/ReadingForm';
import { SettingsPage } from './components/SettingsPage';
import { InfoModal } from './components/InfoModal';
import { ChatAssistant } from './components/ChatAssistant';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';

import { TooltipProvider } from './components/ui/Tooltip';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function AppContent() {
  const { 
    user, 
    isAuthReady, 
    activeTab,
    isReadingFormOpen,
    setReadingFormOpen,
    isInfoModalOpen,
    setInfoModalOpen
  } = useAppStore();

  useAuth();

  const { data: dashboard } = useDashboard();
  const { data: readings } = useReadings();

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'history' && <History />}
      {activeTab === 'report' && (
        <MedicalReport 
          dashboard={dashboard || null} 
          allReadings={readings || null} 
          onClose={() => useAppStore.getState().setActiveTab('dashboard')}
        />
      )}
      {activeTab === 'ai' && (
        <AIPredictions 
          dashboard={dashboard || { 
            today: null,
            recentReadings: [], 
            recentDailyAverages: [],
            stats: { 
              periodAverages: { morning: null, evening: null },
              finalAverage: null,
              periodDays: [],
              daysCount: 0,
              isComplete: false,
              historicalCycles: []
            }
          }} 
          userProfile={user}
        />
      )}
      {activeTab === 'settings' && <SettingsPage />}

      {/* Modals */}
      {isReadingFormOpen && <ReadingForm onClose={() => setReadingFormOpen(false)} />}
      {isInfoModalOpen && <InfoModal onClose={() => setInfoModalOpen(false)} />}
      
      <ChatAssistant readings={readings || []} userProfile={user} />
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <AppContent />
        <Toaster position="top-center" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
