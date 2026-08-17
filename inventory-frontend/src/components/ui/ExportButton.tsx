import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "./Button";

export function ExportButton() {
  const [loans, setLoans] = useState(true);
  const [inventory, setInventory] = useState(true);
  const [sales, setSales] = useState(true);
  const [summary, setSummary] = useState(true);
  const [gold, setGold] = useState(true);
  const [silver, setSilver] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    const params = new URLSearchParams({
      loans: String(loans),
      inventory: String(inventory),
      sales: String(sales),
      summary: String(summary),
      gold: String(gold),
      silver: String(silver),
    });

    try {
      const res = await fetch(`/api/export?${params}`);
      const blob = await res.blob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KK_Jewelers_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export error", e);
    } finally {
      setLoading(false);
    }
  }

  const exportOptions = [
    { label: "Active Loans", val: loans, set: setLoans },
    { label: "Full Inventory", val: inventory, set: setInventory },
    { label: "Gold Products", val: gold, set: setGold },
    { label: "Silver Products", val: silver, set: setSilver },
    { label: "Sales Ledger", val: sales, set: setSales },
    { label: "Executive Summary", val: summary, set: setSummary },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {exportOptions.map(({ label, val, set }) => (
          <label
            key={label}
            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-2/60 border border-border/50 hover:bg-surface-2 cursor-pointer transition-colors text-xs text-foreground select-none"
          >
            <input
              type="checkbox"
              checked={val}
              onChange={(e) => set(e.target.checked)}
              className="rounded bg-surface border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer accent-[oklch(0.65_0.18_265)]"
            />
            <span className="font-medium">{label}</span>
          </label>
        ))}
      </div>

      <div>
        <Button
          onClick={handleExport}
          variant="primary"
          size="md"
          isLoading={loading}
          disabled={
            loading ||
            (!loans && !inventory && !sales && !summary && !gold && !silver)
          }
          leftIcon={
            loading ? undefined : <FileSpreadsheet className="w-4 h-4" />
          }
        >
          {loading ? "Generating Excel Workbook…" : "Export to Excel (.xlsx)"}
        </Button>
      </div>
    </div>
  );
}