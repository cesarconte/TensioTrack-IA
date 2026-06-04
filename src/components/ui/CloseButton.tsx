import * as React from "react";
import { X, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

interface CloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tooltip?: string;
  icon?: LucideIcon;
  iconClassName?: string;
}

const CloseButton = React.forwardRef<HTMLButtonElement, CloseButtonProps>(
  ({ className, icon: Icon = X, iconClassName, label, tooltip, type = "button", ...props }, ref) => {
    const button = (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        className={cn(
          "inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-surface-high text-on-surface-variant transition-all hover:bg-surface-highest active:scale-95 cursor-pointer",
          className
        )}
        {...props}
      >
        <Icon className={cn("h-5 w-5", iconClassName)} />
      </button>
    );

    if (!tooltip) return button;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    );
  }
);

CloseButton.displayName = "CloseButton";

export { CloseButton };
