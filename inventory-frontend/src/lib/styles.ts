import { cn } from "./utils";

/**
 * Standardized typography and form style tokens
 * Used across all views and modals for visual consistency
 */

export const typography = {
  pageTitle: "text-lg md:text-xl font-semibold tracking-tight text-foreground",
  pageSubtitle: "text-xs md:text-[12.5px] text-muted-foreground mt-0.5",
  sectionTitle: "text-xs uppercase tracking-wider font-semibold text-muted-foreground",
  cardTitle: "text-sm md:text-base font-semibold tracking-tight text-foreground",
  cardSubtitle: "text-[12px] text-muted-foreground mt-0.5",
  label: "text-[11.5px] font-medium text-muted-foreground tracking-wide",
  caption: "text-[11px] text-muted-foreground",
  tableHeader: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
  kpi: "text-2xl md:text-[28px] font-semibold tracking-tight text-foreground leading-none",
  monoValue: "font-mono text-xs text-muted-foreground",
} as const;

export const fieldLabel = typography.label;

export const fieldInput =
  "w-full bg-surface-2 border border-border/60 hover:border-border rounded-lg py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed";

export const selectClass =
  "w-full bg-surface-2 border border-border/60 hover:border-border rounded-lg py-2.5 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all disabled:opacity-50 disabled:cursor-not-allowed";

export const cardStyles =
  "rounded-xl bg-surface border border-border/70 p-5 md:p-6 shadow-sm";

export const tableContainer =
  "rounded-xl border border-border/80 bg-surface overflow-hidden";
