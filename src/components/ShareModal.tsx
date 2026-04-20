import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "motion/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip";
import { Button } from "./ui/Button";
import { toast } from "sonner";
import { X, Share2, Check, Copy } from "lucide-react";

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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-card w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-border"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-display font-black text-lg text-foreground">Compartir Historial</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={onClose} 
                    className="p-2 hover:bg-on-surface/5 rounded-full transition-all hover:scale-110 active:scale-90"
                    aria-label="Cerrar modal de compartir"
                  >
                    <X className="text-[20px] text-on-surface-variant/60" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Cerrar modal de compartir</TooltipContent>
              </Tooltip>
            </div>

            <div className="p-8 flex flex-col items-center text-center space-y-8">
              <div className="p-6 bg-white rounded-[2.5rem] shadow-xl border-4 border-surface-low">
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
                <p className="text-sm font-bold text-foreground">Escanea este código</p>
                <p className="text-xs text-on-surface-variant">Tu médico puede escanear este código para ver tu historial directamente en su dispositivo.</p>
              </div>

              <div className="w-full space-y-3">
                <Button variant="primary" size="lg" className="w-full" onClick={handleNativeShare}>
                  <Share2 className="text-[16px] mr-2" />
                  Compartir Enlace
                </Button>
                <Button variant="secondary" size="lg" className="w-full" onClick={handleCopy}>
                  {copied ? <Check className="text-[16px] text-success mr-2" /> : <Copy className="text-[16px] mr-2" />}
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
