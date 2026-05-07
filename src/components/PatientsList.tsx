import * as React from "react";
import { Users, Search, LayoutDashboard, History, FileText, HeartPulse, ChevronRight, User } from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "../store/useAppStore";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";

interface PatientCard {
  id: string; // Patient UID
  displayName: string;
  email: string;
  photoURL?: string;
  age?: number;
  sex?: string;
}

export function PatientsList() {
  const { setActivePatientId, setActiveTab } = useAppStore();
  const [searchTerm, setSearchTerm] = React.useState("");

  const { data: patients, isLoading } = useQuery<PatientCard[]>({
    queryKey: ['doctor-patients', auth.currentUser?.uid],
    enabled: !!auth.currentUser,
    queryFn: async () => {
      // 1. Get authorizations where doctorId == auth.currentUser.uid
      const authRef = collection(db, 'authorizations');
      const q = query(
        authRef, 
        where('doctorId', '==', auth.currentUser?.uid)
      );
      const snap = await getDocs(q);
      
      const authDocs = snap.docs
        .map(d => d.data())
        .filter(d => d.status !== 'revoked');

      if (authDocs.length === 0) return [];
      
      const patientIds = authDocs.map(d => d.patientId);
      
      // Batch fetch profiles (avoiding N+1)
      const results: PatientCard[] = [];
      const chunks = [];
      for (let i = 0; i < patientIds.length; i += 30) {
        chunks.push(patientIds.slice(i, i + 30));
      }

      const userProfiles: Record<string, any> = {};
      
      for (const chunk of chunks) {
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('__name__', 'in', chunk));
        const userSnap = await getDocs(userQuery);
        userSnap.forEach(doc => {
          userProfiles[doc.id] = doc.data();
        });
      }

      return authDocs.map(auth => {
        const profile = userProfiles[auth.patientId];
        return {
          id: auth.patientId,
          displayName: profile?.displayName || auth.patientName || 'Paciente',
          email: profile?.email || auth.patientEmail || '-',
          age: profile?.age,
          photoURL: profile?.photoURL
        } as PatientCard;
      });
    }
  });

  const filtered = patients?.filter(p => p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || p.email.toLowerCase().includes(searchTerm.toLowerCase())) || [];

  const handleSelectPatient = (patient: PatientCard, targetTab: 'dashboard' | 'history' | 'ai' | 'report' = 'dashboard') => {
    setActivePatientId(patient.id, patient.displayName);
    setActiveTab(targetTab);
  };

  const getAvatarData = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const colors = [
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
    ];
    const index = name.length % colors.length;
    return { initials, colorClass: colors[index] };
  };

  return (
    <div className="flex flex-col gap-8 min-h-[calc(100vh-12rem)] animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32 sm:pb-0">
      <header className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display font-black text-foreground tracking-tight mb-2">Pacientes</h1>
            <p className="text-on-surface-variant font-medium flex items-center gap-2">
              Código profesional: <span className="font-mono bg-surface-high px-2.5 py-0.5 rounded-md text-primary font-bold select-all tracking-wider">{auth.currentUser?.uid}</span>
            </p>
          </div>
        </div>

        {/* Search - MD3 Search Bar */}
        <div className="relative group max-w-2xl mx-auto w-full">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-all duration-300" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-14 pl-14 pr-6 bg-surface-low rounded-full border-none outline-none focus:ring-4 focus:ring-primary/10 text-base font-medium transition-all placeholder:text-on-surface-variant/40"
          />
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
             <div key={i} className="bg-surface-low rounded-[2.5rem] h-52 animate-pulse border border-surface-highest/5"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center bg-surface-low rounded-[3.5rem] border-none"
        >
          <div className="w-24 h-24 bg-surface-high rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Users size={48} className="text-on-surface-variant/20" />
          </div>
          <h3 className="text-2xl font-display font-black text-foreground mb-3">No hay resultados</h3>
          <p className="text-on-surface-variant max-w-sm mx-auto leading-relaxed">
            {searchTerm 
              ? "No hemos encontrado pacientes que coincidan con tu búsqueda." 
              : "Tus pacientes aún no te han vinculado. Comparte tu código profesional para empezar."}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((patient, index) => {
              const avatar = getAvatarData(patient.displayName);
              return (
                <motion.div
                  key={patient.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.04, type: "spring", stiffness: 100 }}
                  className="h-full"
                >
                  <Card 
                    interactive
                    onClick={() => handleSelectPatient(patient)}
                    className="h-full flex flex-col p-0 overflow-hidden"
                  >
                    <CardHeader className="p-7 sm:p-8 pb-0">
                      <div className="flex items-center gap-5">
                        <div className="relative shrink-0">
                          {patient.photoURL ? (
                            <img 
                              src={patient.photoURL} 
                              alt={patient.displayName} 
                              className="w-16 h-16 rounded-3xl object-cover ring-2 ring-background shadow-lg" 
                            />
                          ) : (
                            <div className={`w-16 h-16 rounded-3xl ${avatar.colorClass} flex items-center justify-center font-black text-xl shadow-md border-2 border-background`}>
                              {avatar.initials}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-background rounded-full shadow-sm" title="Activo" />
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <CardDescription className="mb-1 text-primary/60 font-black">PACIENTE</CardDescription>
                          <CardTitle className="text-xl sm:text-2xl font-black text-foreground truncate group-hover:text-primary transition-colors tracking-tight leading-none h-8">
                            {patient.displayName}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-7 sm:p-8 pt-6 space-y-6 flex-1 flex flex-col justify-between">
                      <div>
                        {patient.age && (
                          <div className="inline-flex items-center px-3 py-1.5 rounded-xl bg-surface-high text-on-surface-variant text-[11px] font-black uppercase tracking-widest leading-none">
                            {patient.age} años
                          </div>
                        )}
                      </div>

                      {/* Integrated Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSelectPatient(patient, 'dashboard'); }}
                          className="flex-1 h-12 rounded-2xl bg-surface-high/50 flex items-center justify-center text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all duration-300 group/btn"
                          title="Ver Dashboard"
                        >
                          <LayoutDashboard size={20} className="transition-transform group-hover/btn:scale-110" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSelectPatient(patient, 'history'); }}
                          className="flex-1 h-12 rounded-2xl bg-surface-high/50 flex items-center justify-center text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all duration-300 group/btn"
                          title="Ver Historial"
                        >
                          <History size={20} className="transition-transform group-hover/btn:scale-110" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSelectPatient(patient, 'report'); }}
                          className="flex-1 h-12 rounded-2xl bg-surface-high/50 flex items-center justify-center text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all duration-300 group/btn"
                          title="Generar Informe"
                        >
                          <FileText size={20} className="transition-transform group-hover/btn:scale-110" />
                        </button>
                        
                        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20 group-hover:scale-105 transition-all ml-1 shrink-0">
                          <ChevronRight size={22} strokeWidth={3} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
