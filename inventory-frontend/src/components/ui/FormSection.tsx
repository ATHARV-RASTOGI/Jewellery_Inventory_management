import React from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className,
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="pb-2 border-b border-border/60">
        <h3 className="text-[15px] font-bold tracking-tight text-foreground">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
};
