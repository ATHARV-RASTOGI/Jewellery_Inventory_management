import { apiClient } from "./client";

// Define the Loan type here since we removed the mock-data import
export type Loan = {
  id: string;
  name: string;
  mobileNo: string;
  address?: string;
  metal: "Gold" | "Silver";
  loanAmount: number;
  issueDate: string;
  status: "active" | "closed";
  description ?: string;
  weight: number;

};

export type InterestPayment = {
  id: number;
  loanId: number;
  amountPaid: number;
  paymentDate: string;
  balanceAfter: number;
};

export type SettleLoanInput = {
  id: string;
  closeDate: string;
  settlementAmount: number;
};

// GET /api/loans
export async function fetchLoans(): Promise<Loan[]> {
  const response = await apiClient.get<Loan[]>("/loans");
  return response.data;
}

// POST /api/loans
export async function issueLoan(
  input: Omit<Loan, "id" | "status"> & { status?: Loan["status"] },
): Promise<Loan> {
  const response = await apiClient.post<Loan>("/loans", input);
  return response.data;
}

// PATCH /api/loans/{id}/close  -> settles a loan with closeDate + amount
export async function settleLoan({ id, closeDate, settlementAmount }: SettleLoanInput): Promise<Loan | void> {
  const response = await apiClient.patch<Loan>(`/loans/${id}/close`, { 
    closeDate, 
    settlementAmount 
   
  });
  return response.data;
}

// DELETE /api/loans/{id}
export async function closeLoan(id: string): Promise<void> {
  await apiClient.delete(`/loans/${id}`);
}

export async function payInterest(input: {
  id: string;
  amountPaid: number;
}): Promise<InterestPayment> {
  const response = await apiClient.post<InterestPayment>(
    `/loans/${input.id}/pay-interest`,
    { amountPaid: input.amountPaid }
  );
  return response.data;
}

// GET: fetch all interest payments for a loan
export async function fetchInterestPayments(loanId: string): Promise<InterestPayment[]> {
  const response = await apiClient.get<InterestPayment[]>(
    `/loans/${loanId}/interest-payments`
  );
  return response.data;
}