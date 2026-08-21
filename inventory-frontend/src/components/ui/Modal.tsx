import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const maxWidthStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = "md",
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

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full rounded-2xl bg-surface border border-border/80 p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto shadow-[var(--shadow-elevated)]",
          maxWidthStyles[maxWidth],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && (
              <h3 className="text-base md:text-lg font-semibold tracking-tight text-foreground">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div>{children}</div>

        {/* Footer actions */}
        {footer && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
