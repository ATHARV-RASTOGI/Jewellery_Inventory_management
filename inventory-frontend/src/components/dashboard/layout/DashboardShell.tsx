import { useEffect, useState } from "react";
import {
  Bell,
  Search,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  ShoppingBag,
  Scale,
  PackagePlus,
  ClipboardList,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "./Sidebar";
import { TopStats } from "../analytics/TopStats";
import { LoanLedger } from "../loans/LoanLedger";
import { LoanIssueForm } from "../loans/LoanIssueForm";
import { SalesLedger } from "../sales/SalesLedger";
import { PurchaseLedger } from "../purchases/PurchaseLedger";
import { InventoryView } from "../inventory/InventoryView";
import { RevenueOverview } from "../analytics/RevenueOverview";
import { SalesByMaterial } from "../analytics/SalesByMaterial";
import { WeeklySales } from "../analytics/WeeklySales";
import { RecentSales } from "../analytics/RecentSales";
import { CustomOrderForm } from "../orders/CustomOrderForm";
import { SettingsPage } from "../settings/SettingsPage";
import { RateUpdateModal } from "../analytics/RateUpdateModal";
import { fetchDashboardStats } from "@/lib/api/dashboard";
import { queryKeys } from "@/lib/api/query-keys";
import { formatINR } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/Button";

export const DashboardShell = () => {
  const [activeView, setActiveView] = useState<string>("dashboard");
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const { isDark, setTheme } = useTheme();

  const { data: stats } = useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: fetchDashboardStats,
  });

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
      subtitle: "Live market rates, revenue metrics, and operational performance.",
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
    "purchase-ledger": {
      title: "Purchase Register",
      subtitle: "Record wholesale purchases, track supplier invoices, and manage stock acquisition.",
    },
    "custom-order": {
      title: "Custom Orders",
      subtitle: "Manage bespoke jewelry orders, advance payments, and pickup schedules.",
    },
    settings: {
      title: "Settings & System Management",
      subtitle: "Configure categories, manage database exports, and store preferences.",
    },
    gold: {
      title: "Gold Catalog",
      subtitle: "Manage 24K, 22K, 18K gold jewelry inventory, weights, and stock levels.",
    },
    silver: {
      title: "Silver Catalog",
      subtitle: "Manage silver jewelry, utensils, articles, and stock quantities.",
    },
  };

  const getMetadata = (view: string) => {
    if (viewMetadata[view]) return viewMetadata[view];
    if (view.startsWith("gold")) {
      return {
        title: "Gold Catalog",
        subtitle: "Manage gold jewelry inventory, weights, and stock levels.",
      };
    }
    if (view.startsWith("silver")) {
      return {
        title: "Silver Catalog",
        subtitle: "Manage silver jewelry inventory and stock levels.",
      };
    }
    return {
      title: "Inventory Catalog",
      subtitle: "Manage product stock levels, purities, and base pricing.",
    };
  };

  const currentMeta = getMetadata(activeView);
  const showDashboardWidgets = activeView === "dashboard";

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Quick Action Operations Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded bg-surface border border-border shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground px-1 select-none">
                  Counter Workflows:
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setActiveView("sales-ledger")}
                  leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
                  className="font-semibold"
                >
                  New Counter Sale
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setActiveView("issue-loan")}
                  leftIcon={<Scale className="w-3.5 h-3.5 text-amber-500" />}
                >
                  Issue Girvi Loan
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setActiveView("purchase-ledger")}
                  leftIcon={<PackagePlus className="w-3.5 h-3.5 text-emerald-500" />}
                >
                  Record Purchase
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setActiveView("custom-order")}
                  leftIcon={<ClipboardList className="w-3.5 h-3.5 text-blue-500" />}
                >
                  Custom Order
                </Button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono px-2 select-none">
                <span>Shift: Morning Counter</span>
                <span className="text-border">·</span>
                <span className="text-success font-semibold">● System Ready</span>
              </div>
            </div>

            {/* Operational Metrics Barometer */}
            <TopStats />

            {/* Operational Command Center (Transactions & Turnover on Left, Fiscal Analysis on Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
              {/* Left Column: Live Operations & Invoices Feed */}
              <div className="lg:col-span-7 space-y-3.5">
                <RecentSales />
                <WeeklySales />
              </div>

              {/* Right Column: Financial Breakdown & Fiscal Trends */}
              <div className="lg:col-span-5 space-y-3.5">
                <SalesByMaterial />
                <RevenueOverview />
              </div>
            </div>
          </div>
        );

      case "loan-ledger":
        return <LoanLedger />;

      case "issue-loan":
        return <LoanIssueForm onClose={() => setActiveView("loan-ledger")} />;

      case "sales-ledger":
        return <SalesLedger />;

      case "purchase-ledger":
        return <PurchaseLedger />;

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
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-200">
        {/* Header Bar */}
        <header className="h-12 px-4 lg:px-6 flex items-center justify-between gap-3 border-b border-border bg-surface/95 backdrop-blur-xs sticky top-0 z-30 shrink-0">
          {/* Left: Sidebar Toggle & Breadcrumb */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
              title={sidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
              className="w-7 h-7 rounded bg-surface-2 border border-border text-muted-foreground hover:text-foreground hover:bg-surface-3 flex items-center justify-center transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-3.5 h-3.5 text-primary" />
              ) : (
                <PanelLeftClose className="w-3.5 h-3.5" />
              )}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground leading-tight select-none">
                <span className="font-semibold text-foreground/80 truncate hidden sm:inline">K.K Jewellers</span>
                <span className="text-border hidden sm:inline">/</span>
                <h1 className="text-xs sm:text-[13px] font-semibold text-foreground tracking-tight truncate">
                  {currentMeta.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Center: Live Rates Ticker */}
          {stats && (
            <div className="hidden xl:flex items-center gap-3 px-3 py-1 rounded bg-surface-2/90 border border-border text-xs font-mono select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="text-[10.5px] uppercase tracking-wider font-sans font-semibold text-muted-foreground">Gold 24K:</span>
                <span className="font-bold text-foreground">
                  {formatINR(stats.goldRatePerGram * 10)}/10g
                </span>
              </div>
              <span className="text-border">|</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                <span className="text-[10.5px] uppercase tracking-wider font-sans font-semibold text-muted-foreground">Silver:</span>
                <span className="font-bold text-foreground">
                  {formatINR(stats.silverRatePerGram * 10)}/10g
                </span>
              </div>
              <button
                onClick={() => setRateModalOpen(true)}
                title="Update Today's Market Rates"
                className="ml-1 p-0.5 rounded text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Right: Search, Theme Toggle, Notification */}
          <div className="flex items-center gap-2">
            <div className="relative w-44 lg:w-56 hidden md:block">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                placeholder="Search ledger, SKU... (Ctrl+K)"
                className="w-full bg-surface-2 border border-border rounded pl-8 pr-2.5 h-7.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              />
            </div>

            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label="Toggle Theme"
              title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
              className="w-7.5 h-7.5 rounded bg-surface-2 border border-border text-muted-foreground hover:text-foreground hover:bg-surface-3 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-primary" />
              )}
            </button>

            <button
              aria-label="Notifications"
              className="w-7.5 h-7.5 rounded bg-surface-2 border border-border text-muted-foreground hover:text-foreground hover:bg-surface-3 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 px-4 lg:px-6 py-4 overflow-y-auto max-w-[1720px] w-full mx-auto">
          {renderView()}
        </main>
      </div>

      {stats && (
        <RateUpdateModal
          open={rateModalOpen}
          onClose={() => setRateModalOpen(false)}
          currentGold={stats.goldRatePerGram * 10}
          currentSilver={stats.silverRatePerGram * 10}
        />
      )}
    </div>
  );
};