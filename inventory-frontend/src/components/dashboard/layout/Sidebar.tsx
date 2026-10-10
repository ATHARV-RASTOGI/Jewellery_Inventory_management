import {
  Gem,
  BookOpen,
  Scale,
  LayoutDashboard,
  Settings,
  LogOut,
  ShoppingBag,
  PackagePlus,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  Coins,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  metalDot?: "gold" | "silver";
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Operations",
    items: [
      { id: "sales-ledger", label: "Sales Ledger", icon: ShoppingBag },
      { id: "purchase-ledger", label: "Purchases", icon: PackagePlus },
    ],
  },
  {
    title: "Loans & Pledges",
    items: [
      { id: "loan-ledger", label: "Active Loans", icon: BookOpen },
      { id: "issue-loan", label: "Issue New Loan", icon: Scale },
    ],
  },
  {
    title: "Inventory & Catalog",
    items: [
      { id: "gold", label: "Gold Catalog", icon: Gem, metalDot: "gold" },
      { id: "silver", label: "Silver Catalog", icon: Coins, metalDot: "silver" },
    ],
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
  const isItemActive = (item: NavItem) => {
    if (item.id === "gold") {
      return activeView === "gold" || activeView.startsWith("gold-");
    }
    if (item.id === "silver") {
      return activeView === "silver" || activeView.startsWith("silver-");
    }
    return activeView === item.id;
  };

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 bg-surface border-r border-border flex flex-col select-none shrink-0 transition-all duration-200 ease-in-out z-40",
        collapsed ? "w-14" : "w-58"
      )}
    >
      {/* Brand Header */}
      <div className="h-12 px-3 border-b border-border flex items-center justify-between shrink-0 bg-surface-2/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            onClick={() => collapsed && onToggleCollapse()}
            className={cn(
              "w-7 h-7 rounded bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0",
              collapsed && "cursor-pointer hover:bg-gold/25"
            )}
            title={collapsed ? "Expand sidebar (Ctrl+B)" : "K.K Jewellers ERP"}
          >
            <Gem className="w-3.5 h-3.5 text-gold" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-bold tracking-tight text-foreground leading-none truncate uppercase">
                K.K Jewellers
              </h2>
              <p className="text-[9.5px] text-muted-foreground mt-0.5 truncate uppercase tracking-widest font-mono">
                ERP Workstation
              </p>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            title="Collapse sidebar (Ctrl+B)"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2.5 space-y-2.5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-0.5">
            {!collapsed && (
              <p className="px-2 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const active = isItemActive(item);
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 h-8 rounded text-xs font-medium transition-colors select-none text-left cursor-pointer",
                    active
                      ? "bg-surface-2 text-foreground font-semibold border-l-2 border-primary shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-2/60",
                    collapsed && "justify-center px-0"
                  )}
                >
                  {item.metalDot ? (
                    <div className="relative shrink-0 flex items-center justify-center">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span
                        className={cn(
                          "absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-surface",
                          item.metalDot === "gold" ? "bg-amber-400" : "bg-slate-300"
                        )}
                      />
                    </div>
                  ) : (
                    <Icon className="w-4 h-4 shrink-0" />
                  )}

                  {!collapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-2 border-t border-border shrink-0">
        {collapsed ? (
          <button
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            title="Expand sidebar (Ctrl+B)"
            className="w-full h-8 rounded bg-surface-2 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <PanelLeftOpen className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="px-2 py-1.5 rounded bg-surface-2/70 border border-border/80 flex items-center gap-2">
            <div className="w-6.5 h-6.5 rounded bg-primary/15 text-primary border border-primary/25 flex items-center justify-center text-[10.5px] font-bold shrink-0 font-mono">
              AR
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate leading-tight">
                Atharv Rastogi
              </p>
              <p className="text-[9.5px] text-muted-foreground truncate font-mono uppercase tracking-wider">
                Store Admin
              </p>
            </div>
            <button
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors cursor-pointer"
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