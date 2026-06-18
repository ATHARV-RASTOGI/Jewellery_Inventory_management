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
export const LOAN_MONTHLY_INTEREST = 0.02; 

export function calculateLoanSettlement(principal: number, issueDate: string, closeDate: string = new Date().toISOString()) {
  const issue = new Date(issueDate);
  const close = new Date(closeDate);
  
  const diffInTime = close.getTime() - issue.getTime();
  const diffInMonths = Math.max(1, diffInTime / (1000 * 3600 * 24 * 30.44)); 
  
  const totalamount = principal * Math.pow((1 + LOAN_MONTHLY_INTEREST), diffInMonths);
  const interestAmount = totalamount - principal;

  return {
    principal,
    interestAmount,
    totalAmount: principal + interestAmount,
    months: Math.ceil(diffInMonths)
  };
}

export function formatNum(num: number) {
  return new Intl.NumberFormat("en-IN").format(num);
}