import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const widthStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  badge,
  actions,
  width = "md",
  children,
  footer,
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/60 backdrop-blur-xs transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full bg-surface border-l border-border flex flex-col transition-transform duration-250 ease-out shadow-elevated",
          widthStyles[width],
          open ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-start justify-between px-4 py-3 border-b border-border bg-surface-2/60 shrink-0">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-foreground truncate">
                {title}
              </h2>
              {badge && <div className="shrink-0">{badge}</div>}
            </div>
            {subtitle && (
              <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {actions}
            <button
              onClick={onClose}
              aria-label="Close drawer"
              className="w-7 h-7 rounded border border-border/60 bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {children}
        </div>

        {/* Drawer Footer Actions */}
        {footer && (
          <div className="px-4 py-3 border-t border-border bg-surface-2/40 flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </aside>
    </>
  );
};
