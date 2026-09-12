import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Store, MapPin, Phone, FileText, Scale } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  fetchStoreProfile,
  updateStoreProfile,
  type StoreProfile,
} from "@/lib/api/storeProfile";

export const StoreProfileSettings = () => {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["store-profile"],
    queryFn: fetchStoreProfile,
  });

  const [form, setForm] = useState<Partial<StoreProfile>>({});

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const mutation = useMutation({
    mutationFn: updateStoreProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-profile"] });
      toast.success("Store profile updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update store profile.");
    },
  });

  const handleChange = (field: keyof StoreProfile, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    mutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        Loading store profile...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Shop Name"
          placeholder="e.g. SWARNA MAHAL JEWELLERS"
          value={form.shopName ?? ""}
          onChange={(e) => handleChange("shopName", e.target.value)}
          leftIcon={<Store size={14} />}
        />
        <Input
          label="Address"
          placeholder="e.g. 123, Sarafa Bazar, Main Road, City (U.P.)"
          value={form.address ?? ""}
          onChange={(e) => handleChange("address", e.target.value)}
          leftIcon={<MapPin size={14} />}
        />
        <Input
          label="GSTIN"
          placeholder="e.g. 09AAAAA0000A1Z5"
          value={form.gstin ?? ""}
          onChange={(e) => handleChange("gstin", e.target.value)}
          leftIcon={<FileText size={14} />}
        />
        <Input
          label="State Code"
          placeholder="e.g. 09 (U.P.)"
          value={form.stateCode ?? ""}
          onChange={(e) => handleChange("stateCode", e.target.value)}
        />
        <Input
          label="Phone"
          placeholder="e.g. +91 98765 43210"
          value={form.phone ?? ""}
          onChange={(e) => handleChange("phone", e.target.value)}
          leftIcon={<Phone size={14} />}
        />
        <Input
          label="Jurisdiction Court"
          placeholder="e.g. City Court"
          value={form.jurisdictionCourt ?? ""}
          onChange={(e) => handleChange("jurisdictionCourt", e.target.value)}
          leftIcon={<Scale size={14} />}
        />
      </div>
      <Button
        variant="primary"
        size="sm"
        leftIcon={<Save size={14} />}
        isLoading={mutation.isPending}
        onClick={handleSave}
      >
        Save Profile
      </Button>
    </div>
  );
};
