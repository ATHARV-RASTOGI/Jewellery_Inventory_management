import { useState } from "react";
import {
  ChevronDown,
  Gem,
  BookOpen,
  Scale,
  LayoutDashboard,
  Settings,
  LogOut,
  ShoppingBag,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  Coins,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getSidebarCategories } from "@/lib/categories";

type Props = {
  activeView: string;
  onViewChange: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export const Sidebar = ({
  activeView,
  onViewChange,
  collapsed,
  onToggleCollapse,
}: Props) => {
  const [openMetal, setOpenMetal] = useState<"gold" | "silver" | null>("gold");
  const [expandedCat, setExpandedCat] = useState<string | null>("gold-rings");

  const itemClass = (active: boolean) =>
    cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 select-none relative group",
      active
        ? "bg-primary/15 text-primary border border-primary/25 font-semibold shadow-xs"
        : "text-muted-foreground hover:text-foreground hover:bg-surface-2/80",
      collapsed && "justify-center px-0 py-2.5"
    );

  const sectionLabel =
    "px-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70 mb-2";

  // Reusable component for rendering the category trees in expanded mode
  const CategoryTree = ({
    categories,
    metal,
  }: {
    categories: any[];
    metal: "gold" | "silver";
  }) => (
    <div className="mt-1 ml-3 pl-3 border-l border-border/60 space-y-0.5 animate-in fade-in duration-200">
      {categories.map((cat) => {
        const hasSub = cat.subcategories && cat.subcategories.length > 0;
        const isExpanded = expandedCat === cat.id;
        const isActive = activeView === cat.id;

        return (
          <div key={cat.id}>
            <button
              onClick={() => {
                if (hasSub) setExpandedCat(isExpanded ? null : cat.id);
                onViewChange(cat.id);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors",
                isActive
                  ? "text-primary font-semibold bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2/50"
              )}
            >
              <span className="flex-1 text-left truncate">{cat.label}</span>
              {hasSub && (
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200 opacity-60",
                    isExpanded && "rotate-180"
                  )}
                />
              )}
            </button>

            {hasSub && isExpanded && (
              <div className="ml-2.5 pl-2 border-l border-border/40 mt-0.5 space-y-0.5 animate-in fade-in duration-150">
                {cat.subcategories.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => onViewChange(s.id)}
                    className={cn(
                      "w-full text-left px-2 py-1 rounded-md text-[12px] transition-colors truncate",
                      activeView === s.id
                        ? "text-primary font-semibold bg-primary/10"
                        : "text-muted-foreground/80 hover:text-foreground hover:bg-surface-2/40"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 bg-surface border-r border-border/60 flex flex-col select-none shrink-0 transition-all duration-300 ease-in-out z-40",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="px-3.5 pt-5 pb-4 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div
            onClick={() => collapsed && onToggleCollapse()}
            className="w-9 h-9 rounded-xl bg-gold-soft border border-gold/25 flex items-center justify-center shadow-xs shrink-0 cursor-pointer"
            title={collapsed ? "Expand sidebar" : "K.K Jewellers"}
          >
            <Gem className="w-4.5 h-4.5 text-gold" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 animate-in fade-in duration-200">
              <h2 className="text-[14.5px] font-bold tracking-tight text-foreground leading-tight truncate">
                K.K Jewellers
              </h2>
              <p className="text-[11px] text-muted-foreground truncate">
                Nehru Road · Farrukhabad
              </p>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button */}
        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            title="Collapse sidebar (Ctrl+B)"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2.5 py-4 space-y-4">
        {/* Overview */}
        <div>
          {!collapsed && <p className={sectionLabel}>Overview</p>}
          <button
            onClick={() => onViewChange("dashboard")}
            className={itemClass(activeView === "dashboard")}
            title={collapsed ? "Dashboard" : undefined}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Dashboard</span>}
          </button>
        </div>

        {/* Ledger & Loans */}
        <div>
          {!collapsed && <p className={sectionLabel}>Ledger &amp; Loans</p>}
          <div className="space-y-0.5">
            <button
              onClick={() => onViewChange("loan-ledger")}
              className={itemClass(activeView === "loan-ledger")}
              title={collapsed ? "Active Loans Ledger" : undefined}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Active Loans</span>}
            </button>
            <button
              onClick={() => onViewChange("issue-loan")}
              className={itemClass(activeView === "issue-loan")}
              title={collapsed ? "Issue New Loan" : undefined}
            >
              <Scale className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Issue New Loan</span>}
            </button>
          </div>
        </div>

        {/* Sales */}
        <div>
          {!collapsed && <p className={sectionLabel}>Sales</p>}
          <div className="space-y-0.5">
            <button
              onClick={() => onViewChange("sales-ledger")}
              className={itemClass(activeView === "sales-ledger")}
              title={collapsed ? "Sales Ledger" : undefined}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Sales Ledger</span>}
            </button>
          </div>
        </div>

        {/* Inventory */}
        <div>
          {!collapsed && <p className={sectionLabel}>Inventory</p>}
          <div className="space-y-1">
            {/* Gold Inventory */}
            <div>
              <button
                onClick={() => {
                  if (collapsed) {
                    onToggleCollapse();
                    setOpenMetal("gold");
                  } else {
                    setOpenMetal(openMetal === "gold" ? null : "gold");
                  }
                }}
                className={itemClass(
                  openMetal === "gold" && activeView.startsWith("gold")
                )}
                title={collapsed ? "Gold Inventory" : undefined}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 shadow-xs" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Gold Inventory</span>
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform duration-200 opacity-60",
                        openMetal === "gold" && "rotate-180"
                      )}
                    />
                  </>
                )}
              </button>
              {!collapsed && openMetal === "gold" && (
                <CategoryTree
                  categories={getSidebarCategories("gold")}
                  metal="gold"
                />
              )}
            </div>

            {/* Silver Inventory */}
            <div>
              <button
                onClick={() => {
                  if (collapsed) {
                    onToggleCollapse();
                    setOpenMetal("silver");
                  } else {
                    setOpenMetal(openMetal === "silver" ? null : "silver");
                  }
                }}
                className={itemClass(
                  openMetal === "silver" && activeView.startsWith("silver")
                )}
                title={collapsed ? "Silver Inventory" : undefined}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0 shadow-xs" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Silver Inventory</span>
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform duration-200 opacity-60",
                        openMetal === "silver" && "rotate-180"
                      )}
                    />
                  </>
                )}
              </button>
              {!collapsed && openMetal === "silver" && (
                <CategoryTree
                  categories={getSidebarCategories("silver")}
                  metal="silver"
                />
              )}
            </div>
          </div>
        </div>

        {/* Custom Orders */}
        <div>
          {!collapsed && <p className={sectionLabel}>Orders</p>}
          <button
            onClick={() => onViewChange("custom-order")}
            className={itemClass(activeView === "custom-order")}
            title={collapsed ? "Custom Orders" : undefined}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="flex-1 text-left">Custom Orders</span>}
          </button>
        </div>

        {/* Settings */}
        <div>
          {!collapsed && <p className={sectionLabel}>System</p>}
          <button
            onClick={() => onViewChange("settings")}
            className={itemClass(activeView === "settings")}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </button>
        </div>
      </nav>

      {/* User Footer Card & Collapse Toggle Button */}
      <div className="p-2.5 border-t border-border/40">
        {collapsed ? (
          <button
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            title="Expand sidebar (Ctrl+B)"
            className="w-full h-10 rounded-xl bg-surface-2/70 border border-border/50 flex items-center justify-center text-primary hover:bg-surface-3 transition-colors"
          >
            <PanelLeftOpen className="w-4.5 h-4.5" />
          </button>
        ) : (
          <div className="p-2.5 rounded-xl bg-surface-2/70 border border-border/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xs font-bold shrink-0">
              AR
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold text-foreground truncate leading-tight">
                Atharv Rastogi
              </p>
              <p className="text-[10.5px] text-muted-foreground truncate">
                Administrator
              </p>
            </div>
            <button
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};