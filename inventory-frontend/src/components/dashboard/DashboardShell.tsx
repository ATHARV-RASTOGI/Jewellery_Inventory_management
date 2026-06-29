import { useState } from "react";
import { Bell, Search } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { TopStats } from "./TopStats";
import { LoanLedger } from "./LoanLedger";
import { LoanIssueForm } from "./LoanIssueForm";
import { SalesLedger } from "./SalesLedger";
import { ExportButton } from "../ui/ExportButton";
import { InventoryView } from "./InventoryView";

export const DashboardShell = () => {
  const [activeView, setActiveView] = useState<string>("dashboard");

  const viewTitle =
    activeView === "dashboard"
      ? "Dashboard"
      : activeView === "loan-ledger"
        ? "Active Loans Ledger"
        : activeView === "issue-loan"
          ? "Issue New Loan"
          : activeView === "sales-ledger"
            ? "Sales Ledger"
            : activeView === "settings"
              ? "Settings"
              : "Inventory";

  const showStats = activeView === "dashboard";

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 px-8 flex items-center gap-4">
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight">{viewTitle}</h1>
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

        <main className="flex-1 px-8 pb-10 space-y-6 overflow-y-auto">
  {showStats && <TopStats />}

  {activeView === "dashboard" ? (
    <div className="flex items-center justify-center h-[50vh] text-muted-foreground text-sm">
      Dashboard overview area
    </div>
  ) : activeView === "loan-ledger" ? (
    <LoanLedger />
  ) : activeView === "issue-loan" ? (
    <LoanIssueForm />
  ) : activeView === "sales-ledger" ? (
    <SalesLedger />
  ) : activeView === "settings" ? (
    <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="rounded-xl bg-surface p-6 border border-border/40">
        <h2 className="text-sm font-medium tracking-tight mb-1 text-foreground">
          Data Backup & Reports
        </h2>
        <ExportButton />
      </div>
    </div>
  ) : (
    // EVERYTHING ELSE is treated as an Inventory request
    <InventoryView activeView={activeView} />
  )}
</main>
      </div>
    </div>
  );
};