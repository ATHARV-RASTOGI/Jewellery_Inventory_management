import { apiClient } from "./client";

// Define the Loan type here since we removed the mock-data import
export type Loan = {
  id: string;
  customerName: string;
  phoneNumber: string;
  address?: string;
  metalType: "Gold" | "Silver";
  loanAmount: number;
  issueDate: string;
  status: "active" | "closed";
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