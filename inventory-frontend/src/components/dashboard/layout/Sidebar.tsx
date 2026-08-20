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
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSidebarCategories } from "@/lib/categories";

type Props = {
  activeView: string;
  onViewChange: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Ledger & Loans",
    items: [
      { id: "loan-ledger", label: "Active Loans", icon: BookOpen },
      { id: "issue-loan", label: "Issue New Loan", icon: Scale },
    ],
  },
  {
    title: "Sales",
    items: [{ id: "sales-ledger", label: "Sales Ledger", icon: ShoppingBag }],
  },
  {
    title: "Orders",
    items: [
      { id: "custom-order", label: "Custom Orders", icon: ClipboardList },
    ],
  },
  {
    title: "System",
    items: [{ id: "settings", label: "Settings", icon: Settings }],
  },
];

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

  const CategoryTree = ({
    categories,
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
        {NAV_GROUPS.slice(0, 3).map((group) => (
          <div key={group.title}>
            {!collapsed && <p className={sectionLabel}>{group.title}</p>}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={itemClass(activeView === item.id)}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Inventory Group */}
        <div>
          {!collapsed && <p className={sectionLabel}>Inventory</p>}
          <div className="space-y-1">
            {(["gold", "silver"] as const).map((metal) => {
              const isOpen = openMetal === metal;
              const isMetalActive = activeView.startsWith(metal);
              const label = metal === "gold" ? "Gold Inventory" : "Silver Inventory";
              const colorDot =
                metal === "gold" ? "bg-amber-400" : "bg-slate-300";

              return (
                <div key={metal}>
                  <button
                    onClick={() => {
                      if (collapsed) {
                        onToggleCollapse();
                        setOpenMetal(metal);
                      } else {
                        setOpenMetal(isOpen ? null : metal);
                      }
                    }}
                    className={itemClass(isOpen && isMetalActive)}
                    title={collapsed ? label : undefined}
                  >
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full shrink-0 shadow-xs",
                        colorDot
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{label}</span>
                        <ChevronDown
                          className={cn(
                            "w-3.5 h-3.5 transition-transform duration-200 opacity-60",
                            isOpen && "rotate-180"
                          )}
                        />
                      </>
                    )}
                  </button>
                  {!collapsed && isOpen && (
                    <CategoryTree
                      categories={getSidebarCategories(metal)}
                      metal={metal}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {NAV_GROUPS.slice(3).map((group) => (
          <div key={group.title}>
            {!collapsed && <p className={sectionLabel}>{group.title}</p>}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={itemClass(activeView === item.id)}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer Card */}
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