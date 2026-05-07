import * as React from "react";
import { Stethoscope, Plus, Trash2, CheckCircle2, ShieldAlert, Share2, QrCode } from "lucide-react";
import { collection, query, where, getDocs, deleteDoc, doc, serverTimestamp, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { toast } from "sonner";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "../store/useAppStore";
import { QRCodeSVG } from "qrcode.react";
import { QRScanner } from "./QRScanner";

interface AuthDoc {
  id: string;
  doctorId: string;
  doctorName?: string;
  doctorEmail?: string;
  patientId: string;
  patientName?: string;
  createdAt: any;
}

export function DoctorLinkManager() {
  const [doctorIdInput, setDoctorIdInput] = React.useState("");
  const [isScanning, setIsScanning] = React.useState(false);
  const queryClient = useQueryClient();
  const { user } = useAppStore();

  const { data: authorizations, isLoading } = useQuery<AuthDoc[]>({
    queryKey: ['authorizations', auth.currentUser?.uid],
    enabled: !!auth.currentUser,
    queryFn: async () => {
      const q = query(
        collection(db, 'authorizations'),
        where('patientId', '==', auth.currentUser?.uid)
      );
      const snap = await getDocs(q);
      
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AuthDoc));
      
      // Fetch doctor profiles
      for (const d of docs) {
        try {
          const doctorRef = doc(db, 'users', d.doctorId);
          const doctorSnap = await getDoc(doctorRef);
          if (doctorSnap.exists()) {
            d.doctorName = doctorSnap.data().displayName;
            d.doctorEmail = doctorSnap.data().email;
          }
        } catch (e) {
          console.warn("Could not fetch doctor profile", e);
        }
      }
      return docs;
    }
  });

  const linkMutation = useMutation({
    mutationFn: async (doctorId: string) => {
      if (!auth.currentUser) throw new Error("No autenticado");
      
      const authId = `${doctorId}_${auth.currentUser.uid}`;
      const authDocRef = doc(db, 'authorizations', authId);
      
      // Check if already linked using getDoc (more efficient with our rules)
      const authSnap = await getDoc(authDocRef);
      if (authSnap.exists()) {
        throw new Error("Este médico ya está vinculado a tu cuenta.");
      }

      // Fetch doctor name
      let doctorName = "Médico Profesional";
      try {
        const docRef = doc(db, 'users', doctorId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          doctorName = data.displayName || doctorName;
        } else {
          // If ID is too short, we can detect it
          if (doctorId.length < 20) {
             throw new Error("El ID parece estar incompleto o es inválido.");
          }
          throw new Error("No se pudo encontrar al profesional con ese ID.");
        }
      } catch (e: any) {
        console.error("Error fetching doctor:", e);
        if (e.message.includes("permission")) {
           console.warn("Permission denied when reading doctor profile");
        } else {
           throw e;
        }
      }

      await setDoc(authDocRef, {
        doctorId,
        patientId: auth.currentUser.uid,
        doctorName: doctorName,
        patientName: user?.displayName || 'Paciente',
        patientEmail: user?.email || '',
        createdAt: serverTimestamp(),
        status: 'active'
      });
    },
    onSuccess: () => {
      setDoctorIdInput("");
      toast.success("¡Médico vinculado exitosamente!");
      queryClient.invalidateQueries({ queryKey: ['authorizations'] });
    },
    onError: (e: any) => {
      const message = e.message || "Error al vincular. Verifica que el ID sea correcto.";
      toast.error(message);
      console.error("Doctor linkage failed:", e);
    }
  });

  const unlinkMutation = useMutation({
    mutationFn: async (authId: string) => {
      await deleteDoc(doc(db, 'authorizations', authId));
    },
    onSuccess: () => {
      toast.success("Acceso revocado exitosamente.");
      queryClient.invalidateQueries({ queryKey: ['authorizations'] });
    },
    onError: () => {
      toast.error("Error al revocar acceso.");
    }
  });

  const handleLink = () => {
    const id = doctorIdInput.trim();
    if (!id) return;
    if (id === auth.currentUser?.uid) {
      toast.error("No puedes vincularte a ti mismo.");
      return;
    }
    linkMutation.mutate(id);
  };

  const shareLinkUrl = `${window.location.origin}/?add_doctor=${auth.currentUser?.uid}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Vincular Médico - TensioTrack',
          text: 'Haz clic en el enlace para vincularme como tu médico en TensioTrack:',
          url: shareLinkUrl,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error("Error sharing", err);
      }
    } else {
      navigator.clipboard.writeText(shareLinkUrl);
      toast.success("Enlace de invitación copiado al portapapeles.");
    }
  };

  const handleScan = (data: string) => {
    setIsScanning(false);
    try {
      // Check if it's a URL or just the ID raw
      if (data.includes('add_doctor=')) {
        const url = new URL(data);
        const docId = url.searchParams.get('add_doctor');
        if (docId) {
          setDoctorIdInput(docId);
          linkMutation.mutate(docId);
          return;
        }
      } else if (data && data.length > 5) {
        setDoctorIdInput(data);
        linkMutation.mutate(data);
        return;
      }
      toast.error("El código QR no parece ser válido o no contiene un ID.");
    } catch (e) {
      toast.error("Error al leer el código QR.");
    }
  };

  return (
    <div className="bg-surface-low rounded-[3rem] p-6 sm:p-12 space-y-8 sm:space-y-10 shadow-sm mt-8">
      {isScanning && (
        <QRScanner onScan={handleScan} onCancel={() => setIsScanning(false)} />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-2xl font-display font-black text-foreground">Acceso Profesional</h4>
          <p className="text-on-surface-variant text-sm">Gestiona qué médicos pueden acceder a tu historial clínico.</p>
        </div>
        <div className="px-4 py-2 bg-primary/10 rounded-xl flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest self-start sm:self-center shrink-0">
          <Stethoscope className="text-[16px]" />
          Supervisión Médica
        </div>
      </div>

      {user?.role === 'doctor' && (
        <div className="bg-[#E9E6F0] p-6 sm:p-10 rounded-[2rem] shadow-inner space-y-6 border border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Stethoscope className="w-48 h-48" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
            
            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-border/50 shrink-0 mx-auto md:mx-0">
              <QRCodeSVG 
                value={shareLinkUrl} 
                size={160}
                level="Q"
                includeMargin={false}
                className="w-full h-full max-w-[160px]"
              />
            </div>

            <div className="space-y-5 flex-1 w-full text-center md:text-left">
              <div>
                <h5 className="text-xl font-display font-black text-foreground">Tu Invitación de Profesional</h5>
                <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto md:mx-0 leading-relaxed">
                  Muestra este código QR a tus pacientes para que lo escaneen, o envíales el enlace de invitación para que se conecten directamente contigo.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button 
                  onClick={handleShare}
                  size="lg"
                  className="w-full sm:w-auto rounded-full font-bold px-8 shadow-md"
                >
                  <Share2 className="mr-2" size={18} />
                  Compartir Enlace
                </Button>

                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(auth.currentUser?.uid || "");
                    toast.success("Código copiado");
                  }}
                  variant="secondary"
                  size="md"
                  className="w-full sm:w-auto rounded-full font-bold"
                >
                  Copiar ID
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {user?.role !== 'doctor' && (
        <div className="bg-surface p-6 sm:p-8 rounded-[2rem] shadow-inner space-y-6 border border-border border-dashed">
          <div>
            <h5 className="text-lg font-display font-black text-foreground">Añadir Nuevo Médico</h5>
            <p className="text-sm text-on-surface-variant mt-1 mb-6 max-w-lg">
              Para otorgar acceso a tu médico, puedes escanear el código QR que él te mostrará en su pantalla, o introducir su Código (ID) manualmente.
            </p>
            
            <div className="space-y-4">
              <Button 
                onClick={() => setIsScanning(true)} 
                className="w-full sm:w-auto h-14 px-8 rounded-2xl gap-3 font-bold bg-foreground text-background hover:bg-foreground/90 shadow-lg text-sm transition-all"
              >
                <QrCode className="text-[20px]" />
                Escanear QR del Médico
              </Button>

              <div className="flex items-center gap-4 py-2">
                <div className="h-px bg-border flex-1"></div>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">O Introduce el ID</span>
                <div className="h-px bg-border flex-1"></div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  value={doctorIdInput}
                  onChange={e => setDoctorIdInput(e.target.value)}
                  placeholder="Ej. wXyZ123..."
                  className="flex-1 bg-surface-lowest h-14 rounded-2xl px-5 border-none outline-none focus:ring-2 focus:ring-primary shadow-sm text-foreground font-mono text-sm"
                />
                <Button 
                  onClick={handleLink} 
                  isLoading={linkMutation.isPending}
                  disabled={!doctorIdInput.trim()}
                  className="h-14 sm:w-auto px-8 gap-2 font-bold rounded-2xl"
                >
                  <Plus className="text-[20px]" />
                  Vincular
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {user?.role !== 'doctor' && (
        <div className="space-y-4">
          <h5 className="text-sm font-bold text-foreground px-2">Médicos con Acceso</h5>
          
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-20 bg-surface rounded-2xl"></div>
              <div className="h-20 bg-surface rounded-2xl"></div>
            </div>
          ) : authorizations?.length === 0 ? (
            <div className="text-center py-12 px-6 bg-surface/50 rounded-2xl border border-surface-highest/20">
              <ShieldAlert className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-on-surface-variant">No has dado acceso a ningún médico todavía.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {authorizations?.map(a => (
                <div key={a.id} className="bg-surface p-5 rounded-2xl flex items-center justify-between gap-4 group hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                      <Stethoscope className="text-[24px]" />
                    </div>
                    <div className="min-w-0">
                      <h6 className="font-bold text-foreground text-sm truncate">{a.doctorName || "Médico Vinculado"}</h6>
                      <p className="text-xs text-on-surface-variant truncate font-mono mt-0.5" title={a.doctorId}>ID: {a.doctorId.substring(0, 8)}...</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if(confirm("¿Estás seguro de que deseas revocar el acceso a este médico?")) {
                        unlinkMutation.mutate(a.id);
                      }
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                    title="Revocar Acceso"
                  >
                    <Trash2 className="text-[18px]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
