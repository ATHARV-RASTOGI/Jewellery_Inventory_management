import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { updateGoldRate, updateSilverRate } from "@/lib/api/dashboard";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Props = {
  open: boolean;
  onClose: () => void;
  currentGold: number; // per 10g
  currentSilver: number; // per 10g
};

export const RateUpdateModal = ({
  open,
  onClose,
  currentGold,
  currentSilver,
}: Props) => {
  const qc = useQueryClient();
  const [goldInput, setGoldInput] = useState<number>(currentGold);
  const [silverInput, setSilverInput] = useState<number>(currentSilver);

  useEffect(() => {
    if (open) {
      setGoldInput(currentGold);
      setSilverInput(currentSilver);
    }
  }, [open, currentGold, currentSilver]);

  const goldMutation = useMutation({
    mutationFn: () => updateGoldRate(goldInput),
    onSuccess: () => {
      toast.success("Gold rate updated");
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      qc.invalidateQueries({ queryKey: ["dashboard-gold-rate"] });
    },
    onError: () => toast.error("Failed to update gold rate"),
  });

  const silverMutation = useMutation({
    mutationFn: () => updateSilverRate(silverInput),
    onSuccess: () => {
      toast.success("Silver rate updated");
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
      qc.invalidateQueries({ queryKey: ["dashboard-silver-rate"] });
    },
    onError: () => toast.error("Failed to update silver rate"),
  });

  const handleSave = async () => {
    await Promise.all([
      goldMutation.mutateAsync(),
      silverMutation.mutateAsync(),
    ]);
    onClose();
  };

  const isPending = goldMutation.isPending || silverMutation.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update Market Rates"
      subtitle="Overrides today's live rate calculations across inventory and forms."
      maxWidth="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={isPending || !goldInput || !silverInput}
            isLoading={isPending}
            onClick={handleSave}
            leftIcon={<Zap className="w-3.5 h-3.5" />}
          >
            Save Rates
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Gold rate */}
        <div className="space-y-1">
          <Input
            label="Gold Rate (₹ per 10g)"
            type="number"
            value={goldInput || ""}
            onChange={(e) => setGoldInput(parseFloat(e.target.value) || 0)}
            placeholder="e.g. 74500"
            helperText={`= ₹${
              goldInput ? Math.round(goldInput / 10).toLocaleString("en-IN") : "—"
            } per gram (24K Pure)`}
          />
        </div>

        {/* Silver rate */}
        <div className="space-y-1">
          <Input
            label="Silver Rate (₹ per 10g)"
            type="number"
            value={silverInput || ""}
            onChange={(e) => setSilverInput(parseFloat(e.target.value) || 0)}
            placeholder="e.g. 950"
            helperText={`= ₹${
              silverInput
                ? Math.round((silverInput / 10) * 1000).toLocaleString("en-IN")
                : "—"
            } per kg`}
          />
        </div>
      </div>
    </Modal>
  );
};