import { useState } from "react";

// Add ShoppingBag to the imports at the top

import {
  ChevronDown,
  Gem,
  BookOpen,
  Scale,
  LayoutDashboard,
  Boxes,
  Settings,
  LogOut,
  ShoppingBag,
} from "lucide-react";

import { cn } from "@/lib/utils";

// Defined locally so we don't need an external constants file
const INVENTORY_CATEGORIES = [
  {
    id: "rings",
    label: "Rings",
    subcategories: [
      { id: "rings-gents", label: "Gents Rings" },
      { id: "rings-womens", label: "Women's Rings" },
      { id: "rings-couple", label: "Couple Bands" },
      { id: "rings-engagement", label: "Engagement Rings" },
    ],
  },
  {
    id: "necklaces",
    label: "Necklaces",
    subcategories: [
      { id: "necklaces-short", label: "Short Necklaces" },
      { id: "necklaces-long", label: "Long Necklaces" },
      { id: "necklaces-choker", label: "Chokers" },
      { id: "necklaces-temple", label: "Temple Jewellery" },
    ],
  },
  {
    id: "bangles",
    label: "Bangles",
    subcategories: [
      { id: "bangles-daily", label: "Daily Wear" },
      { id: "bangles-bridal", label: "Bridal Bangles" },
      { id: "bangles-kadas", label: "Kadas" },
    ],
  },
  {
    id: "earrings",
    label: "Earrings",
    subcategories: [
      { id: "earrings-studs", label: "Studs" },
      { id: "earrings-drops", label: "Drops & Danglers" },
      { id: "earrings-hoops", label: "Hoops" },
      { id: "earrings-jhumkas", label: "Jhumkas" },
    ],
  },
  {
    id: "chains",
    label: "Chains",
    subcategories: [
      { id: "chains-daily", label: "Daily Wear Chains" },
      { id: "chains-fancy", label: "Fancy Chains" },
    ],
  },
  {
    id: "anklets",
    label: "Anklets",
    subcategories: [
      { id: "anklets-silver", label: "Silver Anklets" },
      { id: "anklets-gold", label: "Gold Anklets" },
      { id: "anklets-fancy", label: "Fancy Anklets" },
    ],
  },
  {
    id: "bracelets",
    label: "Bracelets",
    subcategories: [
      { id: "bracelets-mens", label: "Men's Bracelets" },
      { id: "bracelets-womens", label: "Women's Bracelets" },
      { id: "bracelets-kids", label: "Kids Bracelets" },
    ],
  },
  {
    id: "maang-tikka",
    label: "Maang Tikka",
    subcategories: [
      { id: "maang-tikka-single", label: "Single Tikka" },
      { id: "maang-tikka-mathapatti", label: "Matha Patti" },
    ],
  },
  {
    id: "nose-pins",
    label: "Nose Pins",
    subcategories: [
      { id: "nose-pins-wire", label: "Wire Pins" },
      { id: "nose-pins-studs", label: "Studs" },
      { id: "nose-pins-nath", label: "Nath" },
    ],
  },
  {
    id: "coins-bars",
    label: "Gold Coins & Bars",
    subcategories: [
      { id: "coins-gold", label: "Gold Coins" },
      { id: "coins-silver", label: "Silver Coins" },
      { id: "bars-gold", label: "Gold Bars" },
      { id: "bars-silver", label: "Silver Bars" },
    ],
  },
  {
    id: "sets",
    label: "Jewellery Sets",
    subcategories: [
      { id: "sets-bridal", label: "Bridal Sets" },
      { id: "sets-lightweight", label: "Lightweight Sets" },
    ],
  },
];

type Props = {
  activeView: string;
  onViewChange: (id: string) => void;
};

export const Sidebar = ({ activeView, onViewChange }: Props) => {
  const [inventoryOpen, setInventoryOpen] = useState(true);
  const [expandedCat, setExpandedCat] = useState<string | null>("rings");

  const itemClass = (active: boolean) =>
    cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
      active
        ? "bg-gold-soft text-gold shadow-[0_0_0_1px_oklch(0.82_0.13_86/0.15)]"
        : "text-muted-foreground hover:text-foreground hover:bg-surface-3/60"
    );

  const sectionLabel = "px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70 mb-2";

  return (
    <aside className="w-64 h-screen sticky top-0 bg-surface flex flex-col select-none">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold-soft flex items-center justify-center">
            <Gem className="w-4 h-4 text-gold" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground leading-none">
              K.K Jewellers
            </h2>
            <p className="text-[11px] text-muted-foreground mt-1">Lohai Road</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4 space-y-6">
        <div>
          <p className={sectionLabel}>Overview</p>
          <button
            onClick={() => onViewChange("dashboard")}
            className={itemClass(activeView === "dashboard")}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Dashboard
          </button>
        </div>

        <div>
          <p className={sectionLabel}>Ledger & Loans</p>
          <div className="space-y-0.5">
            <button
              onClick={() => onViewChange("loan-ledger")}
              className={itemClass(activeView === "loan-ledger")}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              Active Loans
            </button>
            <button
              onClick={() => onViewChange("issue-loan")}
              className={itemClass(activeView === "issue-loan")}
            >
              <Scale className="w-4 h-4 shrink-0" />
              Issue New Loan
            </button>
          </div>
        </div>

        {/* After the Ledger & Loans div, before the Inventory div */}
        <div>
          <p className={sectionLabel}>Sales</p>
          <div className="space-y-0.5">
            <button
              onClick={() => onViewChange("sales-ledger")}
              className={itemClass(activeView === "sales-ledger" )}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              Sales Ledger
            </button>
          </div>
        </div>

        <div>
          <p className={sectionLabel}>Inventory</p>
          <div className="space-y-0.5">
            <button
              onClick={() => setInventoryOpen((v) => !v)}
              className={itemClass(false)}
            >
              <Boxes className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">Shop Inventory</span>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 transition-transform",
                  inventoryOpen && "rotate-180"
                )}
              />
            </button>

            {inventoryOpen && (
              <div className="mt-1 ml-3 pl-3 border-l border-border-subtle space-y-0.5">
                {INVENTORY_CATEGORIES.map((cat) => {
                  const hasSub = cat.subcategories.length > 0;
                  const isExpanded = expandedCat === cat.id;
                  const isActive = activeView === cat.id;
                  return (
                    <div key={cat.id}>
                      <button
                        onClick={() => {
                          if (hasSub) {
                            setExpandedCat(isExpanded ? null : cat.id);
                          }
                          onViewChange(cat.id);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors",
                          isActive
                            ? "text-gold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span className="flex-1 text-left">{cat.label}</span>
                        {hasSub && (
                          <ChevronDown
                            className={cn(
                              "w-3 h-3 transition-transform opacity-60",
                              isExpanded && "rotate-180"
                            )}
                          />
                        )}
                      </button>
                      {hasSub && isExpanded && (
                        <div className="ml-2 mt-0.5 space-y-0.5">
                          {cat.subcategories.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => onViewChange(s.id)}
                              className={cn(
                                "w-full text-left px-2.5 py-1 rounded-md text-[12px] transition-colors",
                                activeView === s.id
                                  ? "text-gold"
                                  : "text-muted-foreground/80 hover:text-foreground"
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
            )}
          </div>
        </div>

        <div>
          <p className={sectionLabel}>System</p>
          <button
            onClick={() => onViewChange("settings")}
            className={itemClass(activeView === "settings")}
          >
            <Settings className="w-4 h-4 shrink-0" />
            Settings
          </button>
        </div>
      </nav>

      {/* Admin profile */}
      <div className="m-3 p-3 rounded-xl bg-surface-2/60 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gold-soft text-gold flex items-center justify-center text-sm font-semibold">
          AR
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-foreground truncate">Atharv Rastogi</p>
          <p className="text-[11px] text-muted-foreground truncate">Lohai Road</p>
        </div>
        <button
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};