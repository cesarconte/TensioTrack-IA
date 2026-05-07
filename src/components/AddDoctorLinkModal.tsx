import React, { useEffect, useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { collection, query, where, getDocs, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { ShieldCheck, X } from 'lucide-react';
import { db, auth } from '../firebase';
import { useAppStore } from '../store/useAppStore';
import { toast } from 'sonner';
import { Button } from './ui/Button';

export function AddDoctorLinkModal() {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const { user, isAuthReady } = useAppStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthReady || !user) return;
    
    // Only patients link doctors
    if (user.role === 'doctor' || user.role === 'admin') return;

    const params = new URLSearchParams(window.location.search);
    const doctorParam = params.get('add_doctor');
    
    if (doctorParam) {
      setDoctorId(doctorParam);
      // Clean up URL without reloading
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [isAuthReady, user]);

  const linkMutation = useMutation({
    mutationFn: async (docId: string) => {
      if (!auth.currentUser) throw new Error("No autenticado");
      
      const authId = `${docId}_${auth.currentUser.uid}`;
      const authDocRef = doc(db, 'authorizations', authId);

      // Check duplicate
      const authSnap = await getDoc(authDocRef);
      if (authSnap.exists()) {
        throw new Error("Este médico ya está vinculado.");
      }

      // Fetch name
      let doctorName = "Médico Profesional";
      try {
        const dRef = doc(db, 'users', docId);
        const dSnap = await getDoc(dRef);
        if (dSnap.exists()) {
          const data = dSnap.data();
          doctorName = data.displayName || doctorName;
        } else {
          throw new Error("No se encontró profesional con ese ID.");
        }
      } catch (e: any) {
        console.error("Error fetching doc during link:", e);
        if (e.message.includes("encontró")) throw e;
      }

      await setDoc(authDocRef, {
        doctorId: docId,
        patientId: auth.currentUser.uid,
        doctorName: doctorName,
        patientName: user?.displayName || 'Paciente',
        patientEmail: user?.email || '',
        createdAt: serverTimestamp(),
        status: 'active'
      });
    },
    onSuccess: () => {
      toast.success("¡Médico vinculado exitosamente!");
      queryClient.invalidateQueries({ queryKey: ['authorizations'] });
      setDoctorId(null);
    },
    onError: (e: any) => {
      const msg = e.message || "Error al vincular.";
      toast.error(msg);
      console.error("Link mutation error:", e);
      setDoctorId(null);
    }
  });

  if (!doctorId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface rounded-[2rem] p-8 shadow-2xl relative border border-border/50">
        <button 
          onClick={() => setDoctorId(null)}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-surface-highest text-on-surface hover:scale-105 active:scale-95 transition-transform"
        >
          <X size={16} strokeWidth={3} />
        </button>

        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
          <ShieldCheck size={32} />
        </div>

        <h3 className="text-2xl font-display font-black text-center mb-2">Vincular Médico</h3>
        <p className="text-center text-on-surface-variant text-sm mb-8 leading-relaxed">
          Has recibido una invitación para compartir tu historial clínico con un profesional. ¿Deseas aceptar?
        </p>

        <div className="space-y-3">
          <Button 
            className="w-full rounded-2xl py-6 font-bold text-sm"
            onClick={() => linkMutation.mutate(doctorId)}
            isLoading={linkMutation.isPending}
          >
            Vincular Ahora
          </Button>
          <Button 
            variant="secondary"
            className="w-full rounded-2xl py-6 font-bold text-sm"
            onClick={() => setDoctorId(null)}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
