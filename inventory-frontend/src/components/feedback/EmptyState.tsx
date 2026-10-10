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
        "flex flex-col items-center justify-center text-center py-10 px-4 rounded-md border border-dashed border-border bg-surface/30 select-none",
        className
      )}
    >
      <div className="w-10 h-10 rounded-md bg-surface-2 border border-border flex items-center justify-center text-muted-foreground/70 mb-3 shadow-xs">
        <Icon className="w-5 h-5" />
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
