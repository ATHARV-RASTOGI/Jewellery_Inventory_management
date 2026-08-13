import { ExportButton } from "../../ui/ExportButton";
import { CategorySettings } from "./CategorySettings";

export const SettingsPage = () => (
  <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-top-4 duration-300">
    {/* ── Data Backup ─────────────────────────────────────── */}
    <div className="rounded-xl bg-surface p-6 border border-border/40">
      <h2 className="text-sm font-medium tracking-tight mb-1 text-foreground">
        Data Backup &amp; Reports
      </h2>
      <p className="text-[12px] text-muted-foreground mb-4">
        Export your loans, inventory, and sales data as an Excel file.
      </p>
      <ExportButton />
    </div>

    {/* ── Category Management ─────────────────────────────── */}
    <div className="rounded-xl bg-surface p-6 border border-border/40">
      <h2 className="text-sm font-medium tracking-tight mb-1 text-foreground">
        Categories &amp; Subcategories
      </h2>
      <p className="text-[12px] text-muted-foreground mb-4">
        Manage the product categories shown in the sidebar and product forms.
      </p>
      <CategorySettings />
    </div>
  </div>
);
