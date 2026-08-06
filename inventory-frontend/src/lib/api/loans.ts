import { apiClient } from "./client";

export type Loan = {
  id: string;
  name: string;
  mobileNo: string;
  address?: string;
  metal: "Gold" | "Silver";
  loanAmount: number;
  issueDate: string;
  status: "active" | "closed";
  description?: string;
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

export type SettlementCalculation = {
  principal: number;
  months: number;
  interestAmount: number;
  totalAmount: number;
  monthlyInterest: number;
};

// GET /api/loans
export async function fetchLoans(): Promise<Loan[]> {
  const { data } = await apiClient.get<Loan[]>("/loans");
  return data;
}

// POST /api/loans
export async function issueLoan(
  input: Omit<Loan, "id" | "status"> & { status?: Loan["status"] },
): Promise<Loan> {
  const { data } = await apiClient.post<Loan>("/loans", input);
  return data;
}

// PATCH /api/loans/{id}/close
export async function settleLoan({ id, closeDate, settlementAmount }: SettleLoanInput): Promise<Loan | void> {
  const { data } = await apiClient.patch<Loan>(`/loans/${id}/close`, { closeDate, settlementAmount });
  return data;
}

// DELETE /api/loans/{id}
export async function closeLoan(id: string): Promise<void> {
  await apiClient.delete(`/loans/${id}`);
}

// POST /api/loans/{id}/pay-interest
export async function payInterest(input: { id: string; amountPaid: number }): Promise<InterestPayment> {
  const { data } = await apiClient.post<InterestPayment>(
    `/loans/${input.id}/pay-interest`,
    { amountPaid: input.amountPaid },
  );
  return data;
}

// GET /api/loans/{id}/interest-payments
export async function fetchInterestPayments(loanId: string): Promise<InterestPayment[]> {
  const { data } = await apiClient.get<InterestPayment[]>(`/loans/${loanId}/interest-payments`);
  return data;
}

// GET /api/loans/{id}/calculate-settlement
export async function calculateSettlement(loanId: string, closeDate: string): Promise<SettlementCalculation> {
  const { data } = await apiClient.get<SettlementCalculation>(
    `/loans/${loanId}/calculate-settlement`,
    { params: { closeDate } },
  );
  return data;
}