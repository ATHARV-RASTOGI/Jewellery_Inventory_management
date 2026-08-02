// ---------------------------------------------------------------------------
// Custom Orders API — backed by Spring Boot backend via apiClient
// ---------------------------------------------------------------------------

import { apiClient } from "./client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type MaterialType = "GOLD" | "DIAMOND" | "GOLD_DIAMOND";
export type GoldCarat = "14K" | "18K" | "22K" | "24K";
export type OrderStatus = "PENDING" | "PICKED_UP";

export type CustomOrder = {
  id: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  itemName: string;
  materialType: MaterialType;
  goldCarat?: GoldCarat;
  diamondCarat?: string;
  remarks: string;
  orderDate: string;   // ISO date string "YYYY-MM-DD"
  pickupDate: string;  // ISO date string "YYYY-MM-DD"
  advanceAmount: number;
  totalAmount: number;
  status: OrderStatus;
  linkedSaleId?: number;
};

export type CreateCustomOrderInput = Omit<CustomOrder, "id" | "status" | "linkedSaleId">;

// ─── Field mapping helpers ────────────────────────────────────────────────────
// The backend model uses different field names for some fields.
// Backend → Frontend: orderId→id, designRemark→remarks, Advance→advanceAmount, Total→totalAmount

function fromBackend(raw: any): CustomOrder {
  return {
    id: raw.orderId ?? raw.id,
    customerName: raw.customerName ?? "",
    customerPhone: raw.customerPhone ?? "",
    customerAddress: raw.customerAddress ?? "",
    itemName: raw.itemName ?? "",
    materialType: raw.materialType ?? "GOLD",
    goldCarat: raw.goldCarat,
    diamondCarat: raw.diamondCarat,
    remarks: raw.designRemark ?? raw.remarks ?? "",
    orderDate: raw.orderDate ?? "",
    pickupDate: raw.pickupDate ?? "",
    advanceAmount: Number(raw.advanceAmount ?? 0),
    totalAmount: Number(raw.totalAmount ?? 0),
    status: raw.status ?? "PENDING",
    linkedSaleId: raw.linkedSaleId,
  };
}

function toBackend(input: CreateCustomOrderInput | Partial<CustomOrder>): any {
  return {
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerAddress: input.customerAddress,
    itemName: input.itemName,
    materialType: input.materialType,
    goldCarat: input.goldCarat,
    diamondCarat: input.diamondCarat,
    designRemark: input.remarks,
    orderDate: input.orderDate,
    pickupDate: input.pickupDate,
    advanceAmount: String(input.advanceAmount ?? 0),
    totalAmount: String(input.totalAmount ?? 0),
    status: (input as any).status ?? "PENDING",
    linkedSaleId: (input as any).linkedSaleId,
  };
}

// ─── API functions ─────────────────────────────────────────────────────────

export async function fetchCustomOrders(): Promise<CustomOrder[]> {
  const { data } = await apiClient.get<any[]>("/custom-order/get-all-orders");
  return data.map(fromBackend).sort((a, b) => b.id - a.id);
}

/** Create a new custom order. Returns the saved order with its id. */

export async function createCustomOrder(
  input: CreateCustomOrderInput
): Promise<CustomOrder> {
  const { data } = await apiClient.post<any>(
    "/custom-order/create-new-order",
    toBackend(input)
  );
  return fromBackend(data);
}

/** Mark an order as PICKED_UP, optionally recording the linked sale id. */
export async function markOrderPickedUp(
  orderId: number,
  linkedSaleId?: number
): Promise<CustomOrder> {
  const { data } = await apiClient.put<any>(
    `/custom-order/update-order/${orderId}`,
    toBackend({ status: "PICKED_UP", linkedSaleId } as any)
  );
  return fromBackend(data);
}

/** Delete a custom order (for correction / accidental entry). */
export async function deleteCustomOrder(orderId: number): Promise<void> {
  await apiClient.delete(`/custom-order/delete-order/${orderId}`);
}

/** Update an existing order (status and/or advance amount). */
export async function updateCustomOrder(
  orderId: number,
  patch: Partial<CustomOrder>
): Promise<CustomOrder> {
  const { data } = await apiClient.put<any>(
    `/custom-order/update-order/${orderId}`,
    toBackend(patch as any)
  );
  return fromBackend(data);
}
