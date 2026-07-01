import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updateGoldRate, updateSilverRate } from "@/lib/api/dashboard";

type Props = {
  open: boolean;
  onClose: () => void;
  currentGold: number;   // per 10g
  currentSilver: number; // per gram
};

const fieldLabel = "text-[11.5px] font-medium text-muted-foreground tracking-wide";
const fieldInput =
  "w-full bg-surface-2 border border-transparent rounded-lg py-2.5 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export const RateUpdateModal = ({ open, onClose, currentGold, currentSilver }: Props) => {
  const qc = useQueryClient();
  const [goldInput, setGoldInput] = useState<number>(currentGold);
  const [silverInput, setSilverInput] = useState<number>(currentSilver);

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

  if (!open) return null;

  const isPending = goldMutation.isPending || silverMutation.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface p-6 space-y-5"
        style={{ boxShadow: "var(--shadow-elevated)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">Update Today's Rates</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Overwrites the fetched rate for today
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gold rate */}
        <div className="space-y-1.5">
          <label className={fieldLabel}>
            Gold rate (₹ per 10g)
          </label>
          <div className="relative">
            <input
              type="number"
              className={fieldInput}
              value={goldInput || ""}
              onChange={(e) => setGoldInput(parseFloat(e.target.value) || 0)}
              placeholder="e.g. 74500"
            />
          </div>
          <p className="text-[10.5px] text-muted-foreground">
            = ₹{goldInput ? Math.round(goldInput / 10).toLocaleString("en-IN") : "—"} per gram (24K)
          </p>
        </div>

        {/* Silver rate */}
        <div className="space-y-1.5">
          <label className={fieldLabel}>
            Silver rate (₹ per 10g)
          </label>
          <input
            type="number"
            className={fieldInput}
            value={silverInput || ""}
            onChange={(e) => setSilverInput(parseFloat(e.target.value) || 0)}
            placeholder="e.g. 95"
          />
          <p className="text-[10.5px] text-muted-foreground">
            = ₹{silverInput ? Math.round(silverInput * 1000).toLocaleString("en-IN") : "—"} per kg
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            disabled={isPending || !goldInput || !silverInput}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60"
          >
            <Zap className="w-4 h-4" />
            {isPending ? "Saving…" : "Save rates"}
          </button>
        </div>
      </div>
    </div>
  );
};