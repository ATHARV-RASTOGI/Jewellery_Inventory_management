import { cn } from "./utils";

/**
 * Standardized typography and form style tokens
 * Used across all views and modals for visual consistency
 */

export const typography = {
  pageTitle: "text-lg md:text-xl font-semibold tracking-tight text-foreground",
  pageSubtitle: "text-xs text-muted-foreground mt-0.5",
  sectionTitle: "text-[11px] uppercase tracking-wider font-bold text-muted-foreground",
  cardTitle: "text-xs sm:text-sm font-semibold tracking-tight text-foreground",
  cardSubtitle: "text-[11.5px] text-muted-foreground mt-0.5",
  label: "text-[11px] font-medium text-muted-foreground tracking-wide",
  caption: "text-[11px] text-muted-foreground",
  tableHeader: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground select-none",
  kpi: "text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-none font-mono tabular-nums",
  monoValue: "font-mono tabular-nums text-xs text-muted-foreground",
  tabularValue: "font-mono tabular-nums text-xs text-foreground",
  financialTotal: "font-mono tabular-nums text-sm sm:text-base font-bold text-foreground",
} as const;

export const fieldLabel = typography.label;

export const cardStyles =
  "rounded bg-surface border border-border p-3.5 sm:p-4 shadow-xs";

export const tableContainer =
  "rounded border border-border bg-surface overflow-x-auto shadow-xs";

export const thCell =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-surface-2/90 border-b border-border select-none whitespace-nowrap";

export const tdCell =
  "px-3 py-2 text-xs sm:text-[13px] text-foreground whitespace-nowrap border-b border-border/40";

export const fieldInput =
  "w-full bg-surface-2 border border-border hover:border-border/80 rounded h-8.5 px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export const selectClass =
  "w-full bg-surface-2 border border-border hover:border-border/80 rounded h-8.5 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export const toolbarContainer =
  "flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 bg-surface p-2 sm:p-2.5 rounded border border-border shadow-xs";

export const printSlipContainer =
  "font-sans text-black bg-white p-6 sm:p-8 max-w-[650px] w-full mx-auto border border-gray-300 rounded shadow-sm print:border-none print:shadow-none print:p-2 print:max-w-none";


