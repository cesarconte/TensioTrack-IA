import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check, Share2, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip";
import { Button } from "./ui/Button";
import { toast } from "sonner";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export function ShareModal({ isOpen, onClose, url }: ShareModalProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Enlace copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TensioTrack - Mi Historial de Presión Arterial',
          text: 'Aquí tienes mi historial de presión arterial siguiendo el protocolo AMPA.',
          url: url,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">Compartir Historial</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={onClose} 
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    aria-label="Cerrar modal de compartir"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Cerrar modal de compartir</TooltipContent>
              </Tooltip>
            </div>

            <div className="p-8 flex flex-col items-center text-center space-y-8">
              <div className="p-6 bg-white rounded-3xl shadow-xl border-4 border-slate-50">
                <QRCodeSVG 
                  value={url} 
                  size={180} 
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: "https://picsum.photos/seed/heart/40/40",
                    height: 30,
                    width: 30,
                    excavate: true,
                  }}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Escanea este código</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tu médico puede escanear este código para ver tu historial directamente en su dispositivo.</p>
              </div>

              <div className="w-full space-y-3">
                <Button variant="primary" className="w-full" onClick={handleNativeShare}>
                  <Share2 className="w-4 h-4" />
                  Compartir Enlace
                </Button>
                <Button variant="secondary" className="w-full" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copiado" : "Copiar Enlace"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
