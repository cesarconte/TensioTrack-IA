import * as React from "react";
import { Heart, Activity } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full mt-24 pt-10 pb-6 border-t border-border/30 flex flex-col items-center">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Brand */}
        <div className="flex items-center gap-2 text-primary opacity-80 decoration-transparent">
          <Activity className="w-5 h-5" />
          <span className="text-sm font-black tracking-widest uppercase">TensioTrack</span>
        </div>

        {/* Author & Mission */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-sm text-on-surface-variant">
          <p className="font-medium text-balance">
            Autor del proyecto: <strong className="font-black text-foreground">César C.P.</strong>
          </p>
          <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-border" aria-hidden="true" />
          <p className="flex items-center gap-1.5 font-medium text-balance">
            Diseñado con <Heart className="w-4 h-4 text-destructive" fill="currentColor" aria-label="amor" />
          </p>
        </div>

        {/* Copyright */}
        <div className="text-[10px] text-on-surface-variant/40 font-bold tracking-[0.2em] uppercase mt-4">
          &copy; {currentYear} Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
