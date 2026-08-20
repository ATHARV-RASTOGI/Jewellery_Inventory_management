import React from "react";
import { cn } from "@/lib/utils";
import { tableContainer, thCell } from "@/lib/styles";
import { TableSkeleton } from "@/components/feedback/Skeleton";

export interface ColumnDef {
  header: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}

interface DataTableProps<T> {
  columns: (ColumnDef | string)[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  renderRow: (item: T, index: number) => React.ReactNode;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  skeletonRows?: number;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  renderRow,
  isLoading,
  emptyState,
  skeletonRows = 6,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return <TableSkeleton rows={skeletonRows} />;
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn(tableContainer, className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2/80">
            {columns.map((col, idx) => {
              const def: ColumnDef =
                typeof col === "string" ? { header: col } : col;
              return (
                <th
                  key={idx}
                  className={cn(
                    thCell,
                    def.align === "right" && "text-right",
                    def.align === "center" && "text-center",
                    def.className
                  )}
                >
                  {def.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {data.map((item, index) => (
            <React.Fragment key={keyExtractor(item, index)}>
              {renderRow(item, index)}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
