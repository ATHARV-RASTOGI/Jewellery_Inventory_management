import { apiClient } from "./client";

export type StoreProfile = {
  id: number;
  shopName: string;
  address: string;
  gstin: string;
  stateCode: string;
  phone: string;
  jurisdictionCourt: string;
};

export async function fetchStoreProfile(): Promise<StoreProfile> {
  const { data } = await apiClient.get<StoreProfile>("/store-profile");
  return data;
}

export async function updateStoreProfile(
  profile: Partial<StoreProfile>,
): Promise<StoreProfile> {
  const { data } = await apiClient.put<StoreProfile>("/store-profile", profile);
  return data;
}
