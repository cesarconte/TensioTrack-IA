import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: "bg-linear-to-br from-[#6750A5] to-[#BBA2FD] text-white hover:brightness-110 shadow-lg shadow-[#6750A5]/20 hover:shadow-xl hover:shadow-[#6750A5]/30 border-none",
      secondary: "bg-[#E9E6F0] text-[#1A1A1A] hover:bg-[#E0DDE8] shadow-sm hover:shadow-md border-none",
      outline: "border-2 border-primary/20 bg-transparent hover:bg-primary/5 text-primary hover:border-primary/40",
      ghost: "bg-transparent hover:bg-primary/5 text-on-surface-variant hover:text-primary",
      danger: "bg-destructive text-destructive-foreground hover:brightness-110 shadow-lg shadow-destructive/20 hover:shadow-xl shadow-destructive/30",
      success: "bg-success text-white hover:brightness-110 shadow-lg shadow-success/20 hover:shadow-xl shadow-success/30",
    };

    const sizes = {
      sm: "h-9 px-4 text-xs",
      md: "h-12 px-8 text-sm",
      lg: "h-14 px-10 text-base",
      icon: "h-12 w-12",
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-full font-bold transition-all duration-300 ease-[cubic-bezier(0,0,0,1)] hover:scale-[1.02] active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none disabled:scale-100 gap-2 cursor-pointer",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
