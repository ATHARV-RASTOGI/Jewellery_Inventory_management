import { apiClient } from "./client";

export type Loan = {
  id: string;
  name: string;
  mobileNo: string;
  address?: string;
  metal: "Gold" | "Silver";
  loanAmount: number;
  issueDate: string;
  status: "ACTIVE" | "CLOSED";
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

export type PendingDisbursement = {
  id: number;
  amount: number;
  disbursedDate: string;
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
export async function payInterest(input: { id: string; amountPaid: number; fromDate: string; toDate: string; interestRate: number }): Promise<InterestPayment> {
  const { data } = await apiClient.post<InterestPayment>(
    `/loans/${input.id}/pay-interest`,
    { 
      amountPaid: input.amountPaid,
      fromDate: input.fromDate,
      toDate: input.toDate,
      interestRate: input.interestRate
    },
  );
  return data;
}

// GET /api/loans/{id}/preview-interest
export async function previewInterestForLoan(loanId: string, fromDate: string, toDate: string, rate: number): Promise<SettlementCalculation> {
  const params: Record<string, any> = { toDate, interestRate: rate };
  if (fromDate) params.fromDate = fromDate;
  const { data } = await apiClient.get<SettlementCalculation>(
    `/loans/${loanId}/preview-interest`,
    { params },
  );
  return data;
}

// GET /api/loans/calculate-interest (keep the generic one if it's used elsewhere, but we'll use previewInterestForLoan for the modal)
export async function previewInterest(principal: number, fromDate: string, toDate: string, rate: number): Promise<SettlementCalculation> {
  const { data } = await apiClient.get<SettlementCalculation>(
    `/loans/calculate-interest`,
    { params: { principal, fromDate, toDate, rate } },
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

// GET /api/loans/{id}/pending-disbursements
export async function fetchPendingDisbursements(loanId: string): Promise<PendingDisbursement[]> {
  const { data } = await apiClient.get<PendingDisbursement[]>(`/loans/${loanId}/pending-disbursements`);
  return data;
}

// POST /api/loans/{id}/disbursements
export async function addDisbursement(loanId: string, amount: number, disbursedDate: string): Promise<void> {
  await apiClient.post(`/loans/${loanId}/disbursements`, { amount, disbursedDate });
}

// DELETE /api/loans/{id}/disbursements/{disbursementId}
export async function deleteDisbursement(loanId: string, disbursementId: number): Promise<void> {
  await apiClient.delete(`/loans/${loanId}/disbursements/${disbursementId}`);
}