import { apiClient } from "../../../lib/api-client";
import type { PurityType } from "../../../lib/constants";

export type IssueLoanPayload = {
  name: string;
  mobileNo: string;
  address: string;
  jewelryDescription: string;
  amountGiven: number;
  weightGrams: number;
  purity: PurityType;
  ltvPercentage: number;
  tenureMonths: number;
};

export type Loan = {
  id: number;
  name: string;
  mobileNo: string;
  address: string;
  signature?: string | null;
  jewelryDescription: string;
  amountGiven: number;
  weightGrams: number;
  purity: PurityType;
  ltvPercentage: number;
  tenureMonths: number;
  loanTaken: string; // ISO date string from backend (LocalDate)
};

/**
 * POST /loans  -> create a new loan
 */
export const issueNewLoan = async (payload: IssueLoanPayload): Promise<Loan> => {
  const { data } = await apiClient.post<Loan>("/loans", payload);
  return data;
};

/**
 * GET /loans -> list all loans
 */
export const fetchLoans = async (): Promise<Loan[]> => {
  const { data } = await apiClient.get<Loan[]>("/loans");
  return data;
};