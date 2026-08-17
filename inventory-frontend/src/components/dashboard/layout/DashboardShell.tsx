import { useEffect, useState } from "react";
import {
  Bell,
  Search,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Sidebar } from "./Sidebar";
import { TopStats } from "../analytics/TopStats";
import { LoanLedger } from "../loans/LoanLedger";
import { LoanIssueForm } from "../loans/LoanIssueForm";
import { SalesLedger } from "../sales/SalesLedger";
import { InventoryView } from "../inventory/InventoryView";
import { RevenueOverview } from "../analytics/RevenueOverview";
import { SalesByMaterial } from "../analytics/SalesByMaterial";
import { WeeklySales } from "../analytics/WeeklySales";
import { RecentSales } from "../analytics/RecentSales";
import { CustomOrderForm } from "../orders/CustomOrderForm";
import { SettingsPage } from "../settings/SettingsPage";
import { useTheme } from "@/lib/theme";

export const DashboardShell = () => {
  const [activeView, setActiveView] = useState<string>("dashboard");
  const { isDark, setTheme } = useTheme();

  // Collapsible sidebar state with localStorage persistence
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("kk_sidebar_collapsed") === "true";
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("kk_sidebar_collapsed", String(next));
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const viewMetadata: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: "Executive Dashboard",
      subtitle: "Live market rates, revenue metrics, and inventory overview.",
    },
    "loan-ledger": {
      title: "Active Loans Ledger",
      subtitle: "Track collateral, disburse funds, and record interest settlements.",
    },
    "issue-loan": {
      title: "Issue New Loan",
      subtitle: "Record customer details, collateral weight, and loan terms.",
    },
    "sales-ledger": {
      title: "Sales Ledger",
      subtitle: "Record counter sales, generate GST receipts, and track customer history.",
    },
    "custom-order": {
      title: "Custom Orders",
      subtitle: "Manage bespoke jewelry orders, advance payments, and pickup schedules.",
    },
    settings: {
      title: "Settings & System Management",
      subtitle: "Configure categories, manage database exports, and store preferences.",
    },
    inventory: {
      title: "Inventory Catalog",
      subtitle: "Manage product stock levels, purities, and base pricing.",
    },
  };

  const currentMeta = viewMetadata[activeView] ?? {
    title: "Inventory Catalog",
    subtitle: "Manage product stock levels, purities, and base pricing.",
  };

  const showStats = activeView === "dashboard";

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
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
        return <LoanIssueForm onClose={() => setActiveView("loan-ledger")} />;

      case "sales-ledger":
        return <SalesLedger />;

      case "custom-order":
        return <CustomOrderForm />;

      case "settings":
        return <SettingsPage />;

      default:
        return <InventoryView activeView={activeView} />;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground selection:bg-primary/25">
      {/* Collapsible Sidebar */}
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Header Bar */}
        <header className="h-16 px-6 lg:px-8 flex items-center gap-4 border-b border-border/50 bg-surface/50 backdrop-blur-md sticky top-0 z-30">
          {/* Sidebar Toggle in Header */}
          <button
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
            title={sidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            className="w-8.5 h-8.5 rounded-lg bg-surface-2 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-surface-3 flex items-center justify-center transition-colors shadow-xs shrink-0"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-primary" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          <div>
            <h1 className="text-sm md:text-[15px] font-bold tracking-tight text-foreground leading-tight">
              {currentMeta.title}
            </h1>
            <p className="text-[11.5px] text-muted-foreground hidden sm:block">
              {currentMeta.subtitle}
            </p>
          </div>

          <div className="flex-1" />

          {/* Quick Search */}
          <div className="relative w-64 md:w-72 hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search loans, SKU, customers…"
              className="w-full bg-surface-2 border border-border/50 rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
          </div>

          {/* Quick Theme Toggle Button */}
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle Theme"
            title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
            className="w-8.5 h-8.5 rounded-lg bg-surface-2 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-surface-3 flex items-center justify-center transition-colors shadow-xs"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-primary" />
            )}
          </button>

          {/* Notification Button */}
          <button
            aria-label="Notifications"
            className="w-8.5 h-8.5 rounded-lg bg-surface-2 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-surface-3 flex items-center justify-center transition-colors shadow-xs"
          >
            <Bell className="w-4 h-4" />
          </button>
        </header>

        {/* Content Container */}
        <main className="flex-1 px-6 lg:px-8 pb-12 pt-6 space-y-6 overflow-y-auto max-w-7xl w-full">
          {showStats && <TopStats />}
          {renderView()}
        </main>
      </div>
    </div>
  );
};