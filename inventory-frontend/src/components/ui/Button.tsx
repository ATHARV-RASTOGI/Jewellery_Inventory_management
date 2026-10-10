import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "gold";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs font-semibold border border-primary/20",
  secondary:
    "bg-surface-2 text-foreground hover:bg-surface-3 border border-border font-medium",
  ghost:
    "text-muted-foreground hover:text-foreground hover:bg-surface-2 font-medium",
  danger:
    "bg-danger text-white hover:bg-danger/90 shadow-xs font-medium",
  outline:
    "border border-border text-foreground hover:bg-surface-2 font-medium",
  gold:
    "bg-gold text-surface font-semibold hover:bg-gold/90 shadow-xs border border-gold/40",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-7.5 px-2.5 text-xs gap-1.5 rounded",
  md: "h-8.5 px-3 text-xs sm:text-[13px] gap-2 rounded",
  lg: "h-9.5 px-4 text-sm gap-2 rounded",
  icon: "h-8 w-8 p-0 rounded flex items-center justify-center shrink-0",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center select-none transition-colors duration-100 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed cursor-pointer",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
