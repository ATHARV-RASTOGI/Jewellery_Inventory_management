import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// Number Formatters
export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatWeight(weight: number) {
  return `${weight}g`;
}

export function getStockStatus(stock: number): "in-stock" | "low" | "out" {
  if (stock <= 0) return "out";
  if (stock <= 5) return "low"; 
  return "in-stock";
}

// Loan Calculations

export function formatNum(num: number) {
  return new Intl.NumberFormat("en-IN").format(num);
}