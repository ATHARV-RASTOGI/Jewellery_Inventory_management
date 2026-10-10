import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  trend?: string;
  trendPositive?: boolean;
  showTrendIcon?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendPositive = true,
  showTrendIcon = false,
  className,
}) => {
  return (
    <div
      className={cn(
        "group relative rounded-md bg-surface border border-border p-3.5 sm:p-4 shadow-xs transition-colors hover:border-border/90",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {Icon && (
          <div className="w-7 h-7 rounded-sm bg-surface-2 text-muted-foreground flex items-center justify-center shrink-0 border border-border/50">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="mt-2 text-xl sm:text-2xl font-semibold tracking-tight text-foreground leading-none font-mono">
        {value}
      </div>

      {trend && (
        <div
          className={cn(
            "mt-2 flex items-center gap-1 text-[11px] font-medium",
            trendPositive ? "text-success" : "text-warning"
          )}
        >
          {showTrendIcon &&
            (trendPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
            ))}
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};
