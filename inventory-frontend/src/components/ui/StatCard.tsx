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
        "group relative rounded-xl bg-surface border border-border/80 p-5 transition-all duration-200 hover:border-border hover:bg-surface-2/60 shadow-[var(--shadow-card)]",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-[12px] font-medium text-muted-foreground tracking-wide">
          {title}
        </p>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-surface-2 text-muted-foreground flex items-center justify-center group-hover:text-primary group-hover:bg-primary/10 transition-colors border border-border/40">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 text-2xl md:text-[26px] font-semibold tracking-tight text-foreground leading-none">
        {value}
      </div>

      {trend && (
        <div
          className={cn(
            "mt-3 flex items-center gap-1 text-[11.5px] font-medium",
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
