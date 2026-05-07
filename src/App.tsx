import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from './store/useAppStore';
import { useAuth } from './hooks/useAuth';
import { useDashboard, useReadings, usePatientProfile } from './lib/api';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/dashboard/Dashboard';
import { History } from './components/dashboard/History';
import { MedicalReport } from './components/MedicalReport';
import { AIPredictions } from './components/AIPredictions';
import { ReadingForm } from './components/ReadingForm';
import { SettingsPage } from './components/SettingsPage';
import { VinculoPage } from './components/VinculoPage';
import { PatientsList } from './components/PatientsList';
import { AdminPanel } from './components/AdminPanel';
import { InfoModal } from './components/InfoModal';
import { ChatAssistant } from './components/ChatAssistant';
import { AddDoctorLinkModal } from './components/AddDoctorLinkModal';
import { Toaster, toast } from 'sonner';

import { TooltipProvider } from './components/ui/Tooltip';
import { db, auth, collection, doc, writeBatch, Timestamp } from './firebase';
import { RefreshCw } from "lucide-react";

// Helper to seed test data
if (typeof window !== 'undefined') {
  (window as any).seedTensioTrack = async () => {
    if (!auth.currentUser) {
      console.error('Debes estar autenticado para sembrar datos.');
      toast.error('Debes estar autenticado para sembrar datos.');
      return;
    }

    const userId = auth.currentUser.uid;
    const readingsRef = collection(db, 'users', userId, 'readings');
    
    // Generaremos 30 días de datos (6 periodos de 5 días cada uno)
    // El periodo 6 será el actual (que incluye hoy 2026-04-16)
    const totalDays = 30;
    // Forzamos fecha base en UTC para evitar desfases
    const today = new Date(Date.UTC(2026, 3, 16)); 
    
    toast.loading('Generando 30 días de datos médicos...', { id: 'seeding' });

    try {
      console.log(`Iniciando sembrado para el usuario: ${userId}`);
      const allReadings = [];
      
      for (let dayOffset = totalDays - 1; dayOffset >= 0; dayOffset--) {
        const currentDate = new Date(today);
        currentDate.setUTCDate(currentDate.getUTCDate() - dayOffset);
        
        // Componentes para la fecha
        const y = currentDate.getUTCFullYear();
        const m = currentDate.getUTCMonth();
        const d_val = currentDate.getUTCDate();
        
        // dateString para el campo 'date' (formato YYYY-MM-DD)
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Calcular periodId (cada 5 días cambia)
        const periodId = Math.floor((totalDays - 1 - dayOffset) / 5) + 1;
        
        // Calcular weekId (ISO Week)
        const d_iso = new Date(currentDate);
        d_iso.setUTCHours(0, 0, 0, 0);
        d_iso.setUTCDate(d_iso.getUTCDate() + 4 - (d_iso.getUTCDay() || 7));
        const isoYear = d_iso.getUTCFullYear();
        const firstJan = new Date(Date.UTC(isoYear, 0, 1));
        const week = Math.ceil((((d_iso.getTime() - firstJan.getTime()) / 86400000) + 1) / 7);
        const weekId = `${isoYear}-W${week.toString().padStart(2, '0')}`;

        // Definir estados para el día para asegurar variedad
        // Rotamos entre: Baja, Normal, Normal-Alta, Hipertensión
        const stateCycle = dayOffset % 4;
        let baseSys, baseDia, baseHr;

        switch(stateCycle) {
          case 0: // Hipertensión
            baseSys = 145; baseDia = 95; baseHr = 105; // Taquicardia
            break;
          case 1: // Normal
            baseSys = 118; baseDia = 76; baseHr = 72; // Normal
            break;
          case 2: // Normal-Alta
            baseSys = 132; baseDia = 82; baseHr = 85; // Normal
            break;
          case 3: // Baja
            baseSys = 95; baseDia = 58; baseHr = 55; // Bradicardia
            break;
          default:
            baseSys = 120; baseDia = 80; baseHr = 70;
        }

        const slots = ['morning', 'evening'];
        for (const slot of slots) {
          for (let order = 1; order <= 3; order++) {
            // Un poco de ruido aleatorio (+/- 3)
            const noise = Math.floor(Math.random() * 7) - 3;
            const hour = slot === 'morning' ? 8 : 20;
            const minute = order * 2;
            
            // Construcción robusta del objeto Date usando los componentes extraídos arriba
            const finalDate = new Date(Date.UTC(y, m, d_val, hour, minute));

            allReadings.push({
              systolic: baseSys + noise,
              diastolic: baseDia + Math.floor(noise/2),
              heartRate: baseHr + Math.floor(Math.random() * 10) - 5,
              slot,
              order,
              date: dateString,
              recordedAt: Timestamp.fromDate(finalDate),
              notes: `Carga automática: Estado ${stateCycle === 0 ? 'Hipertensión' : stateCycle === 1 ? 'Normal' : stateCycle === 2 ? 'Normal-Alta' : 'Baja'}`,
              category: 'reposo',
              userUid: userId,
              periodId: periodId,
              weekId: weekId
            });
          }
        }
      }

      // Firestore Batch limit is 500. 30 days * 6 readings = 180. Fits in one batch.
      const batch = writeBatch(db);
      allReadings.forEach(reading => {
        const newDocRef = doc(readingsRef);
        batch.set(newDocRef, reading);
      });

      await batch.commit();
      console.log(`Sembrado completado: ${allReadings.length} lecturas generadas.`);
      toast.success(`Datos generados con éxito: ${allReadings.length} lecturas.`, { id: 'seeding' });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error en seeder:', error);
      toast.error(`Error al sembrar datos: ${error instanceof Error ? error.message : 'Error desconocido'}`, { id: 'seeding' });
    }
  };
}

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
    setActiveTab,
    isReadingFormOpen,
    setReadingFormOpen,
    isInfoModalOpen,
    setInfoModalOpen,
    isDarkMode,
    activePatientId,
    activePatientName
  } = useAppStore();

  // Handle Tab transitions and access control
  React.useEffect(() => {
    if (!user) return;

    if (user.role === 'doctor') {
      if (activePatientId) {
        // If doctor selects a patient, redirect from patients list to dashboard
        if (activeTab === 'patients' || activeTab === 'vinculo') setActiveTab('dashboard');
      } else {
        // If no patient is selected, doctor can only be on patients, vinculo or settings
        if (activeTab !== 'patients' && activeTab !== 'vinculo' && activeTab !== 'settings') {
          setActiveTab('patients');
        }
      }
    } else {
      // Access control for patients/admins
      if (activeTab === 'patients') {
        setActiveTab('dashboard');
      }
      if (activeTab === 'admin' && user.role !== 'admin') {
        setActiveTab('dashboard');
      }
    }
  }, [user, activePatientId, activeTab, setActiveTab]);

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useAuth();

  const { data: dashboard, isLoading: isDashboardLoading } = useDashboard();
  const { data: readings, isLoading: isReadingsLoading } = useReadings();
  const { data: patientProfile } = usePatientProfile(activePatientId);

  const effectiveProfile = activePatientId ? (patientProfile || { displayName: activePatientName, role: 'patient' }) : user;

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <RefreshCw className="text-[40px] text-indigo-600 animate-spin" />
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
          userProfile={effectiveProfile}
        />
      )}
      {activeTab === 'ai' && (
        <AIPredictions 
          isLoadingData={isDashboardLoading}
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
          userProfile={effectiveProfile}
        />
      )}
      {activeTab === 'settings' && <SettingsPage />}
      {activeTab === 'vinculo' && <VinculoPage />}
      {activeTab === 'patients' && user?.role === 'doctor' && <PatientsList />}
      {activeTab === 'admin' && user?.role === 'admin' && <AdminPanel />}

      {/* Modals */}
      {isReadingFormOpen && <ReadingForm onClose={() => setReadingFormOpen(false)} />}
      {isInfoModalOpen && <InfoModal onClose={() => setInfoModalOpen(false)} />}
      <AddDoctorLinkModal />
      
      <ChatAssistant readings={readings || []} userProfile={effectiveProfile} />
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
