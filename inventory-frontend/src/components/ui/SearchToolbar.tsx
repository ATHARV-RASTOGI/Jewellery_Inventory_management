import React from "react";
import { Search, X, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  icon: Icon = Search,
  className,
}) => {
  return (
    <div className={cn("relative flex-1 max-w-sm", className)}>
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-xs bg-surface-2 border border-border/60 hover:border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export interface FilterTabOption<T extends string = string> {
  id: T;
  label: string;
}

interface FilterTabsProps<T extends string = string> {
  options: FilterTabOption<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

export function FilterTabs<T extends string>({
  options,
  active,
  onChange,
  className,
}: FilterTabsProps<T>) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 bg-surface-2 p-1 rounded-lg border border-border/60 shrink-0",
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all select-none",
            active === opt.id
              ? "bg-surface text-primary font-semibold shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface SearchToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-surface p-3.5 rounded-xl border border-border/80 shadow-xs",
        className
      )}
    >
      {children}
    </div>
  );
};
