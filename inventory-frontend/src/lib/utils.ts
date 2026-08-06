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