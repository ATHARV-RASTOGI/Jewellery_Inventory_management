import React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4 rounded-xl border border-dashed border-border/70 bg-surface/40 select-none",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-border/60 flex items-center justify-center text-muted-foreground/70 mb-3.5 shadow-sm">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-foreground tracking-tight">
        {title}
      </h4>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
