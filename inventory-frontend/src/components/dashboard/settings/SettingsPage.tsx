import { useState } from "react";
import { Store, FolderTree, Palette, Download, ShieldCheck, ChevronRight } from "lucide-react";
import { ExportButton } from "../../ui/ExportButton";
import { CategorySettings } from "./CategorySettings";
import { StoreProfileSettings } from "./StoreProfileSettings";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

type SettingsTab = "profile" | "categories" | "theme" | "backup";

const TABS: {
  id: SettingsTab;
  label: string;
  desc: string;
  icon: React.ElementType;
  component: React.ReactNode;
}[] = [
  {
    id: "profile",
    label: "Store Profile & Billing",
    desc: "Business name, GSTIN, address, and invoice headers",
    icon: Store,
    component: <StoreProfileSettings />,
  },
  {
    id: "categories",
    label: "Catalog Taxonomies",
    desc: "Gold & silver product categories and sub-types",
    icon: FolderTree,
    component: <CategorySettings />,
  },
  {
    id: "theme",
    label: "Display & Aesthetics",
    desc: "Enterprise theme and high-contrast color preferences",
    icon: Palette,
    component: <ThemeSelector />,
  },
  {
    id: "backup",
    label: "Master Data Backup",
    desc: "Export ledger workbooks and backup system records",
    icon: Download,
    component: <ExportButton />,
  },
];

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const current = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <PageHeader
        breadcrumbs={["Dashboard", "System", "Settings"]}
        title="Administrative Console"
        subtitle="Manage business credentials, invoice print templates, catalog taxonomies, and audit backups."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
        {/* Navigation Rail */}
        <div className="bg-surface border border-border p-2 space-y-1">
          <div className="px-2.5 py-1.5 text-[10.5px] uppercase font-bold tracking-wider text-muted-foreground">
            Configuration Modules
          </div>
          {TABS.map(({ id, label, desc, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded text-left transition-colors cursor-pointer select-none",
                activeTab === id
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-foreground hover:bg-surface-2"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    activeTab === id ? "text-primary-foreground" : "text-muted-foreground"
                  )}
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-tight truncate">{label}</p>
                  <p
                    className={cn(
                      "text-[10px] truncate mt-0.5",
                      activeTab === id ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}
                  >
                    {desc}
                  </p>
                </div>
              </div>
              <ChevronRight
                className={cn(
                  "w-3.5 h-3.5 shrink-0",
                  activeTab === id ? "text-primary-foreground" : "text-muted-foreground/40"
                )}
              />
            </button>
          ))}
          <div className="pt-3 mt-2 border-t border-border px-2.5 pb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>K.K Jewellers ERP v2.4</span>
          </div>
        </div>

        {/* Active Panel */}
        <div className="bg-surface border border-border p-5 space-y-4">
          <div className="pb-3 border-b border-border">
            <h2 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-wide">
              {current.label}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{current.desc}</p>
          </div>
          {current.component}
        </div>
      </div>
    </div>
  );
};
