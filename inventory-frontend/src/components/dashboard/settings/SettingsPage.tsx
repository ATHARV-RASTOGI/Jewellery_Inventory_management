import { ExportButton } from "../../ui/ExportButton";
import { CategorySettings } from "./CategorySettings";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { PageHeader } from "@/components/layout/PageHeader";

export const SettingsPage = () => (
  <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
    <PageHeader
      breadcrumbs={["Dashboard", "System", "Settings"]}
      title="System Settings"
      subtitle="Customize workspace theme appearance, export store database backups, and manage jewelry category trees."
    />

    <div className="space-y-8 pt-2">
      {/* ── Theme & Appearance ───────────────────────────────── */}
      <div className="space-y-4">
        <div className="pb-2 border-b border-border/60">
          <h2 className="text-[15px] font-bold tracking-tight text-foreground">
            Theme &amp; Visual Appearance
          </h2>
          <p className="text-xs text-muted-foreground">
            Select your preferred visual mode for counter POS and ledger management.
          </p>
        </div>
        <ThemeSelector />
      </div>

      {/* ── Data Backup ─────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="pb-2 border-b border-border/60">
          <h2 className="text-[15px] font-bold tracking-tight text-foreground">
            Data Backup &amp; Master Export
          </h2>
          <p className="text-xs text-muted-foreground">
            Generate an aggregated spreadsheet workbook containing loans, catalog items, and sales records.
          </p>
        </div>
        <ExportButton />
      </div>

      {/* ── Category Management ─────────────────────────────── */}
      <div className="space-y-4">
        <div className="pb-2 border-b border-border/60">
          <h2 className="text-[15px] font-bold tracking-tight text-foreground">
            Categories &amp; Subcategories Management
          </h2>
          <p className="text-xs text-muted-foreground">
            Organize product category trees displayed in the sidebar and catalog filters.
          </p>
        </div>
        <CategorySettings />
      </div>
    </div>
  </div>
);
