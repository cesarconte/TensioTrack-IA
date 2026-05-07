import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, X } from 'lucide-react';
import { Button } from './ui/Button';

interface QRScannerProps {
  onScan: (data: string) => void;
  onCancel: () => void;
}

export function QRScanner({ onScan, onCancel }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let requestAnimationFrameId: number;

    const startCamera = async () => {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        if (!videoRef.current) return;

        setStream(activeStream);
        videoRef.current.srcObject = activeStream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS

        // Wait for metadata to be loaded before playing
        videoRef.current.onloadedmetadata = async () => {
          try {
            if (videoRef.current) {
              await videoRef.current.play();
              requestAnimationFrameId = requestAnimationFrame(tick);
            }
          } catch (playErr: any) {
            // Ignore AbortError which happens on rapid tab switching/unmounting
            if (playErr.name !== 'AbortError') {
              console.error("Video play error:", playErr);
            }
          }
        };
      } catch (err: any) {
        if (err.message && err.message.includes("allow")) {
          setError('El navegador bloqueó la cámara. Si estás en la vista previa, por favor abre la aplicación en una nueva pestaña usando el botón superior derecho, o usa el enlace directo.');
        } else {
          setError('No se pudo acceder a la cámara. Asegúrate de dar permisos o abre la app en una nueva pestaña.');
        }
        console.error("Camera error:", err.message || err);
      }
    };

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (canvas && video) {
          const context = canvas.getContext('2d', { willReadFrequently: true });
          if (context) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (code) {
              onScan(code.data);
              return; // Stop scanning once found
            }
          }
        }
      }
      requestAnimationFrameId = requestAnimationFrame(tick);
    };

    startCamera();

    return () => {
      if (requestAnimationFrameId) cancelAnimationFrame(requestAnimationFrameId);
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface rounded-[2rem] overflow-hidden shadow-2xl relative">
        <div className="p-6 text-center space-y-2">
          <h3 className="text-xl font-display font-black text-foreground">Escanear QR del Médico</h3>
          <p className="text-sm text-on-surface-variant">Apunta con la cámara al código QR que te muestra el profesional.</p>
        </div>
        
        {error ? (
          <div className="p-8 text-center text-destructive">
            {error}
          </div>
        ) : (
          <div className="relative aspect-square w-full bg-black">
            <video 
              ref={videoRef} 
              className="absolute inset-0 w-full h-full object-cover" 
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Target overlay */}
            <div className="absolute inset-x-12 inset-y-12 border-2 border-primary/50 shadow-[0_0_0_999px_rgba(0,0,0,0.5)] rounded-3xl" />
          </div>
        )}

        <div className="p-6 bg-surface">
          <Button 
            variant="secondary" 
            className="w-full text-destructive font-bold bg-destructive/10 hover:bg-destructive/20"
            onClick={onCancel}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
