import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "raised" | "flat";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border border-border/80 p-5 md:p-6 transition-all duration-200",
          variant === "default" && "bg-surface shadow-[var(--shadow-card)]",
          variant === "raised" && "bg-surface-2 shadow-[var(--shadow-elevated)]",
          variant === "flat" && "bg-surface",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader = ({
  className,
  title,
  subtitle,
  action,
  children,
}: {
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 pb-4 border-b border-border/40 mb-4",
        className
      )}
    >
      <div>
        {title && (
          <h3 className="text-sm md:text-base font-semibold tracking-tight text-foreground">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>
        )}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export const CardContent = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return <div className={cn("space-y-4", className)}>{children}</div>;
};
