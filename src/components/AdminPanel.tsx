import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Shield, Users, Activity, Stethoscope, AlertTriangle, User } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { cn } from "../lib/utils";

import { useAppStore } from "../store/useAppStore";

interface AppUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: any;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed: ', JSON.stringify(errInfo));
  return new Error(error instanceof Error ? error.message : String(error));
}

export function AdminPanel() {
  const { user } = useAppStore();
  
  const { data: users, isLoading, refetch } = useQuery<AppUser[]>({
    queryKey: ['admin-all-users', auth.currentUser?.uid],
    enabled: !!auth.currentUser && user?.role === 'admin',
    queryFn: async () => {
      try {
        const q = collection(db, 'users');
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
      } catch (e) {
        throw handleFirestoreError(e, OperationType.LIST, 'users');
      }
    }
  });

  const handleRoleChange = async (userId: string, currentRole: string, newRole: string) => {
    if (currentRole === newRole) return;
    
    if (userId === auth.currentUser?.uid && currentRole === 'admin') {
      toast.error("No puedes cambiar tu propio rol de administrador desde aquí.");
      return;
    }

    try {
      // Admin update must match exactly the fields allowed by security rules
      await setDoc(doc(db, 'users', userId), { 
        role: newRole, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      toast.success("Rol actualizado con éxito");
      refetch();
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, `users/${userId}`);
      toast.error("Error al actualizar rol: " + e.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 md:gap-8 min-h-[calc(100vh-12rem)] animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="h-40 bg-surface-low rounded-[3rem] animate-pulse"></div>
        <div className="h-64 bg-surface-low rounded-[3rem] animate-pulse"></div>
      </div>
    );
  }

  const patientCount = users?.filter(u => u.role === 'patient').length || 0;
  const doctorCount = users?.filter(u => u.role === 'doctor').length || 0;
  const adminCount = users?.filter(u => u.role === 'admin').length || 0;
  const missingRoleCount = users?.filter(u => !u.role).length || 0;

  return (
    <div className="flex flex-col gap-6 md:gap-8 min-h-[calc(100vh-12rem)] animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32 sm:pb-0">
      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary shadow-sm shrink-0">
            <Shield size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black text-foreground tracking-tight">Panel de Administración</h1>
            <p className="text-on-surface-variant font-medium mt-1">
              Supervisión general del sistema y gestión de usuarios.
            </p>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-low rounded-[2rem] p-6 flex flex-col gap-4 border border-surface-highest/10">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <User size={20} />
          </div>
          <div>
            <h3 className="text-on-surface-variant text-sm font-bold uppercase tracking-wider">Pacientes</h3>
            <p className="text-3xl font-display font-black text-foreground">{patientCount}</p>
          </div>
        </div>
        <div className="bg-surface-low rounded-[2rem] p-6 flex flex-col gap-4 border border-surface-highest/10">
          <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500">
            <Stethoscope size={20} />
          </div>
          <div>
            <h3 className="text-on-surface-variant text-sm font-bold uppercase tracking-wider">Médicos</h3>
            <p className="text-3xl font-display font-black text-foreground">{doctorCount}</p>
          </div>
        </div>
        <div className="bg-surface-low rounded-[2rem] p-6 flex flex-col gap-4 border border-surface-highest/10">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-on-surface-variant text-sm font-bold uppercase tracking-wider">Admins</h3>
            <p className="text-3xl font-display font-black text-foreground">{adminCount}</p>
          </div>
        </div>
        <div className={cn(
          "rounded-[2rem] p-6 flex flex-col gap-4 border",
          missingRoleCount > 0 
            ? "bg-error/5 border-error/20" 
            : "bg-surface-low border-surface-highest/10"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            missingRoleCount > 0 ? "bg-error/10 text-error" : "bg-surface-high text-on-surface-variant"
          )}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className={cn(
              "text-sm font-bold uppercase tracking-wider",
              missingRoleCount > 0 ? "text-error" : "text-on-surface-variant"
            )}>Sin Rol</h3>
            <p className={cn(
              "text-3xl font-display font-black",
              missingRoleCount > 0 ? "text-error" : "text-foreground"
            )}>{missingRoleCount}</p>
          </div>
        </div>
      </div>

      {/* User Management List */}
      <div className="bg-surface-low rounded-[3rem] p-6 sm:p-12 shadow-sm border border-surface-highest/10">
         <h4 className="text-2xl font-display font-black text-foreground mb-8">Gestión de Usuarios</h4>
         
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="border-b border-surface-highest/20">
                 <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Usuario</th>
                 <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Correo</th>
                 <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">ID de Firebase</th>
                 <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Rol</th>
               </tr>
             </thead>
             <tbody>
               {users?.map(u => (
                 <tr key={u.id} className="border-b border-surface-highest/10 hover:bg-surface-high/50 transition-colors">
                   <td className="py-4 px-4">
                     <div className="font-bold text-foreground text-sm">{u.displayName || 'Sin nombre'}</div>
                   </td>
                   <td className="py-4 px-4 text-sm text-on-surface-variant">{u.email}</td>
                   <td className="py-4 px-4 text-xs font-mono text-on-surface-variant">{u.id}</td>
                   <td className="py-4 px-4">
                     <select 
                       value={u.role || ''}
                       onChange={(e) => handleRoleChange(u.id, u.role || '', e.target.value)}
                       className={cn(
                         "border text-sm rounded-xl px-3 py-2 outline-none shadow-sm transition-colors",
                         !u.role 
                           ? "bg-error/10 border-error/30 text-error focus:border-error focus:ring-1 focus:ring-error" 
                           : "bg-surface border-surface-highest/20 focus:border-primary focus:ring-1 focus:ring-primary"
                       )}
                     >
                       <option value="" disabled>Seleccionar rol...</option>
                       <option value="patient">Paciente</option>
                       <option value="doctor">Médico</option>
                       <option value="admin">Admin</option>
                     </select>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
}
