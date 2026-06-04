import * as React from "react";
import { cn } from "../../lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive, onClick, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (onKeyDown) {
        onKeyDown(e);
      }
      if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
      }
    };

    return (
      <div
        ref={ref}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "bg-card rounded-[2.5rem] shadow-aura transition-all duration-500 ease-standard",
          interactive && "hover:shadow-2xl hover:scale-[1.01] cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 sm:p-10", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-display font-black text-2xl sm:text-3xl leading-tight tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 sm:p-10 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 sm:p-10 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
