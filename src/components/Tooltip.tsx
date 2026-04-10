import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showOn?: 'always' | 'mobile' | 'desktop';
  align?: 'center' | 'start' | 'end';
}

export const AppTooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  className,
  position = 'top',
  showOn = 'always',
  align = 'center'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return cn(
          "bottom-full mb-2",
          align === 'center' && "left-1/2 -translate-x-1/2",
          align === 'start' && "left-0",
          align === 'end' && "right-0"
        );
      case 'bottom':
        return cn(
          "top-full mt-2",
          align === 'center' && "left-1/2 -translate-x-1/2",
          align === 'start' && "left-0",
          align === 'end' && "right-0"
        );
      case 'left':
        return "right-full top-1/2 -translate-y-1/2 mr-2";
      case 'right':
        return "left-full top-1/2 -translate-y-1/2 ml-2";
      default:
        return "";
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return cn(
          "top-full border-t-slate-900 dark:border-t-slate-800",
          align === 'center' && "left-1/2 -translate-x-1/2",
          align === 'start' && "left-4",
          align === 'end' && "right-4"
        );
      case 'bottom':
        return cn(
          "bottom-full border-b-slate-900 dark:border-b-slate-800",
          align === 'center' && "left-1/2 -translate-x-1/2",
          align === 'start' && "left-4",
          align === 'end' && "right-4"
        );
      case 'left':
        return "left-full top-1/2 -translate-y-1/2 border-l-slate-900 dark:border-l-slate-800";
      case 'right':
        return "right-full top-1/2 -translate-y-1/2 border-r-slate-900 dark:border-r-slate-800";
      default:
        return "";
    }
  };

  return (
    <div 
      className={cn("relative inline-flex items-center justify-center", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ 
              opacity: 0, 
              scale: 0.95, 
              y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0, 
              x: position === 'left' ? 4 : position === 'right' ? -4 : 0 
            }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ 
              opacity: 0, 
              scale: 0.95, 
              y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0, 
              x: position === 'left' ? 4 : position === 'right' ? -4 : 0 
            }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-[110] px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-bold rounded-lg shadow-xl whitespace-normal min-w-[80px] max-w-[180px] text-center pointer-events-none leading-tight",
              getPositionClasses(),
              showOn === 'mobile' && "md:hidden",
              showOn === 'desktop' && "hidden md:block"
            )}
          >
            {content}
            <div className={cn(
              "absolute border-4 border-transparent",
              getArrowClasses()
            )} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
