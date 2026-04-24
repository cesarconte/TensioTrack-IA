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
      primary: "signature-gradient text-white hover:brightness-110 shadow-lg shadow-primary/20",
      secondary: "bg-surface-high text-foreground hover:bg-surface-highest/80 shadow-sm border border-border",
      outline: "border-2 border-primary/10 bg-transparent hover:border-primary/30 text-primary",
      ghost: "bg-transparent hover:bg-primary-container text-on-surface-variant hover:text-primary",
      danger: "bg-destructive text-destructive-foreground hover:brightness-110 shadow-lg shadow-destructive/20",
      success: "bg-success text-white hover:brightness-110 shadow-lg shadow-success/20",
    };

    const sizes = {
      sm: "h-9 px-4 text-[10px]",
      md: "h-12 px-8 text-xs",
      lg: "h-16 px-12 text-sm",
      icon: "h-12 w-12",
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-full font-bold whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0,0,0,1)] hover:scale-[1.02] active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none disabled:scale-100 gap-2 cursor-pointer",
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
