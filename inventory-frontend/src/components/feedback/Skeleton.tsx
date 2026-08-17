import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-surface-2/80 border border-border/20",
        className
      )}
      {...props}
    />
  );
};

export const StatCardSkeleton = () => (
  <div className="rounded-xl bg-surface border border-border/60 p-5 space-y-4 shadow-sm">
    <div className="flex items-center justify-between">
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-7 w-36" />
    <Skeleton className="h-3 w-20" />
  </div>
);

export const ChartSkeleton = ({ height = "h-64" }: { height?: string }) => (
  <div className="rounded-xl bg-surface border border-border/60 p-6 space-y-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <Skeleton className={cn("w-full rounded-lg", height)} />
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="rounded-xl border border-border/80 bg-surface overflow-hidden">
    <div className="h-11 bg-surface-2 border-b border-border flex items-center px-4 gap-4">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-3.5 w-32" />
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="h-3.5 w-16 ml-auto" />
    </div>
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 px-4 flex items-center gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-12 ml-auto" />
        </div>
      ))}
    </div>
  </div>
);
