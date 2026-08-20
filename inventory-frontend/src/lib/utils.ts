import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely (handles conflicts like "px-2 px-4"). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Indian Rupees (₹1,23,456). */
export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format a number with Indian grouping (1,23,456). */
export function formatNum(num: number) {
  return new Intl.NumberFormat("en-IN").format(num);
}

/** Append "g" suffix to a weight number. */
export function formatWeight(weight: number) {
  return `${weight}g`;
}

/** Quick stock-level classification for badges and alerts. */
export function getStockStatus(stock: number): "in-stock" | "low" | "out" {
  if (stock <= 0) return "out";
  if (stock <= 5) return "low";
  return "in-stock";
}

/** Format ISO date string to Indian readable date (e.g. 15 Aug 2024). */
export function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Get current date in YYYY-MM-DD ISO format. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}