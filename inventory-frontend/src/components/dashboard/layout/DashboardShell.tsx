import { useState } from "react";
import { Bell, Search, LayoutDashboard } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { TopStats } from "../analytics/TopStats";
import { LoanLedger } from "../loans/LoanLedger";
import { LoanIssueForm } from "../loans/LoanIssueForm";
import { SalesLedger } from "../sales/SalesLedger";
import { ExportButton } from "../../ui/ExportButton";
import { InventoryView } from "../inventory/InventoryView";
import { RevenueOverview } from "../analytics/RevenueOverview";
import { SalesByMaterial } from "../analytics/SalesByMaterial";
import { WeeklySales } from "../analytics/WeeklySales";
import { RecentSales } from "../analytics/RecentSales";
import { CustomOrderForm } from "../orders/CustomOrderForm";

export const DashboardShell = () => {
  const [activeView, setActiveView] = useState<string>("dashboard");

  const viewTitle: Record<string, string> = {
    "dashboard":    "Dashboard",
    "loan-ledger":  "Active Loans Ledger",
    "issue-loan":   "Issue New Loan",
    "sales-ledger":   "Sales Ledger",
    "custom-order":   "Custom Orders",
    "settings":       "Settings",
    "inventory":      "Inventory",
  };

  const showStats = activeView === "dashboard";

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <RevenueOverview />
      </div>
      <div>
        <SalesByMaterial />
      </div>
      <div className="lg:col-span-2">
        <WeeklySales />
      </div>
      <div>
        <RecentSales />
      </div>
    </div>
  );

      case "loan-ledger":
        return <LoanLedger />;

      case "issue-loan":
        return <LoanIssueForm />;

      case "sales-ledger":
        return <SalesLedger />;

      case "custom-order":
        return <CustomOrderForm />;

      case "settings":
        return (
          <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="rounded-xl bg-surface p-6 border border-border/40">
              <h2 className="text-sm font-medium tracking-tight mb-1 text-foreground">
                Data Backup & Reports
              </h2>
              <p className="text-[12px] text-muted-foreground mb-4">
                Export your loans, inventory, and sales data as an Excel file.
              </p>
              <ExportButton />
            </div>
          </div>
        );

      default:
        // All inventory sub-views (inventory, inventory-add, etc.) fall here
        return <InventoryView activeView={activeView} />;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 px-8 flex items-center gap-4 border-b border-border/30">
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight">
              {viewTitle[activeView] ?? "Inventory"}
            </h1>
            <p className="text-[11.5px] text-muted-foreground">
              Welcome back, manage your shop at a glance.
            </p>
          </div>

          <div className="flex-1" />

          <div className="relative w-72 hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Quick search…"
              className="w-full bg-surface rounded-lg pl-9 pr-3 py-2 text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button className="w-9 h-9 rounded-lg bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-2 flex items-center justify-center transition-colors">
            <Bell className="w-4 h-4" />
          </button>
        </header>

        <main className="flex-1 px-8 pb-10 space-y-6 overflow-y-auto pt-6">
          {showStats && <TopStats />}
          {renderView()}
        </main>
      </div>
    </div>
  );
};