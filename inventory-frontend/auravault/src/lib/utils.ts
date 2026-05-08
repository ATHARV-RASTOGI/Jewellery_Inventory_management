import { type ClassValue,clsx } from "clsx";
import { twMerge } from "tailwind-merge";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount < 0) return "₹—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatWeight(weightInGrams: number): string {
  if (isNaN(weightInGrams) || weightInGrams < 0) return "—";
  // Show "5g" for whole numbers, "5.25g" when precision matters
  const formatted = weightInGrams % 1 === 0
    ? weightInGrams.toString()
    : weightInGrams.toFixed(2);
  return `${formatted}g`;
}

export function formatPurity(karat: 18 | 22 | 24): string {
  return `${karat}K`;
}

export type StockStatus = "in-stock" | "low" | "out";

export function getStockStatus(qty: number): StockStatus {
  if (qty <= 0) return "out";
  if (qty <= 3) return "low";
  return "in-stock";
}

const LTV_RATIO = 0.75; // 75% loan-to-value

export function calculateLoanValue(
  weightInGrams: number,
  goldRatePerGram: number,
  ltvRatio = LTV_RATIO
): { goldValue: number; suggestedLoan: number } {
  const goldValue = weightInGrams * goldRatePerGram;
  const suggestedLoan = Math.floor(goldValue * ltvRatio);
  return { goldValue, suggestedLoan };
}