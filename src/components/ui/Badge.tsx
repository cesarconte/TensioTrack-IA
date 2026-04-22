import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'info';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: "bg-primary text-white border-transparent shadow shadow-primary/10",
    secondary: "bg-surface-high text-foreground border-border",
    outline: "text-on-surface-variant border-border",
    success: "bg-success/5 text-success border-success/10",
    warning: "bg-warning/5 text-warning border-warning/10",
    danger: "bg-destructive/5 text-destructive border-destructive/10",
    info: "bg-primary/5 text-primary border-primary/10",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
