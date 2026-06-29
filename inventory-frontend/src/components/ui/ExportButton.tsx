// src/components/ExportButton.tsx
import { useState } from "react";

export function ExportButton() {
  const [loans, setLoans]         = useState(true);
  const [inventory, setInventory] = useState(true);
  const [sales, setSales]         = useState(true);
  const [summary, setSummary]     = useState(true);
  const [loading, setLoading]     = useState(false);

  async function handleExport() {
    setLoading(true);
    const params = new URLSearchParams({ loans: String(loans), inventory: String(inventory), sales: String(sales), summary: String(summary) });

    const res = await fetch(`/api/export?${params}`);
    const blob = await res.blob();

    // Trigger browser download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KK_Jewelers_${new Date().toISOString().slice(0,10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4 text-sm">
        {[["Loans", loans, setLoans], ["Inventory", inventory, setInventory],
          ["Sales", sales, setSales], ["Summary", summary, setSummary]].map(
          ([label, val, set]: any) => (
            <label key={label} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} />
              {label}
            </label>
          )
        )}
      </div>
      <button
        onClick={handleExport}
        disabled={loading || (!loans && !inventory && !sales && !summary)}
        className="px-6 py-2 text-[11px] tracking-[0.22em] uppercase bg-foreground text-background rounded-full hover:bg-foreground/85 transition-colors disabled:opacity-40"
      >
        {loading ? "Exporting…" : "Export to Excel"}
      </button>
    </div>
  );
}