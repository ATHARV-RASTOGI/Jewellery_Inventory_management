import { useState } from "react";
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

// Split into separate Gold and Silver definitions.
// Notice the IDs are prefixed with the metal type!
const GOLD_CATEGORIES = [
  {
    id: "gold-rings",
    label: "Rings",
    subcategories: [
      { id: "gold-rings-gents", label: "Gents Rings" },
      { id: "gold-rings-womens", label: "Women's Rings" },
      { id: "gold-rings-couple", label: "Couple Bands" },
    ],
  },
  {
    id: "gold-necklaces",
    label: "Necklaces",
    subcategories: [
      { id: "gold-necklaces-short", label: "Short Necklaces" },
      { id: "gold-necklaces-long", label: "Long Necklaces" },
      { id: "gold-necklaces-choker", label: "Chokers" },
    ],
  },
  {
    id: "gold-bangles",
    label: "Bangles",
    subcategories: [
      { id: "gold-bangles-daily", label: "Daily Wear" },
      { id: "gold-bangles-bridal", label: "Bridal Bangles" },
    ],
  },
  {
    id: "gold-earrings",
    label: "Earrings",
    subcategories: [
      { id: "gold-earrings-studs", label: "Studs" },
      { id: "gold-earrings-drops", label: "Drops & Danglers" },
    ],
  },
  {
    id: "gold-sets",
    label: "Jewellery Sets",
    subcategories: [
      { id: "gold-sets-bridal", label: "Bridal Sets" },
      { id: "gold-sets-light", label: "Lightweight Sets" },
    ],
  },
  {
    id: "gold-coins",
    label: "Gold Coins & Bars",
    subcategories: [
      { id: "gold-coins-1g", label: "1g - 5g Coins" },
      { id: "gold-coins-10g", label: "10g+ Coins & Bars" },
    ],
  },
];

const SILVER_CATEGORIES = [
  {
    id: "silver-anklets",
    label: "Anklets (Payal)",
    subcategories: [
      { id: "silver-anklets-daily", label: "Daily Wear" },
      { id: "silver-anklets-bridal", label: "Bridal Heavy" },
    ],
  },
  {
    id: "silver-bracelets",
    label: "Bracelets & Kadas",
    subcategories: [
      { id: "silver-bracelets-mens", label: "Men's Kadas" },
      { id: "silver-bracelets-womens", label: "Women's Bracelets" },
    ],
  },
  {
    id: "silver-rings",
    label: "Silver Rings",
    subcategories: [
      { id: "silver-rings-mens", label: "Men's Rings" },
      { id: "silver-rings-womens", label: "Women's Rings" },
    ],
  },
  {
    id: "silver-pooja",
    label: "Pooja Items & Utensils",
    subcategories: [
      { id: "silver-pooja-idols", label: "Idols (Murti)" },
      { id: "silver-pooja-utensils", label: "Utensils (Bartan)" },
    ],
  },
  {
    id: "silver-coins",
    label: "Silver Coins & Bars",
    subcategories: [
      { id: "silver-coins-10g", label: "10g - 50g Coins" },
      { id: "silver-coins-100g", label: "100g+ Bars" },
    ],
  },
];

type Props = {
  activeView: string;
  onViewChange: (id: string) => void;
};

export const Sidebar = ({ activeView, onViewChange }: Props) => {
  // Separate states for Gold and Silver dropdowns
  const [goldOpen, setGoldOpen] = useState(true);
  const [silverOpen, setSilverOpen] = useState(false);
  
  const [expandedCat, setExpandedCat] = useState<string | null>("gold-rings");

  const itemClass = (active: boolean) =>
    cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
      active
        ? "bg-gold-soft text-gold shadow-[0_0_0_1px_oklch(0.82_0.13_86/0.15)]"
        : "text-muted-foreground hover:text-foreground hover:bg-surface-3/60"
    );

  const sectionLabel = "px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70 mb-2";

  // Reusable component for rendering the category trees
  const CategoryTree = ({ categories }: { categories: any[] }) => (
    <div className="mt-1 ml-3 pl-3 border-l border-border-subtle space-y-0.5">
      {categories.map((cat) => {
        const hasSub = cat.subcategories.length > 0;
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
                isActive ? "text-gold" : "text-muted-foreground hover:text-foreground"
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
                {cat.subcategories.map((s: any) => (
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
  );

  return (
    <aside className="w-64 h-screen sticky top-0 bg-surface flex flex-col select-none">
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
          <button onClick={() => onViewChange("dashboard")} className={itemClass(activeView === "dashboard")}>
            <LayoutDashboard className="w-4 h-4 shrink-0" /> Dashboard
          </button>
        </div>

        <div>
          <p className={sectionLabel}>Ledger & Loans</p>
          <div className="space-y-0.5">
            <button onClick={() => onViewChange("loan-ledger")} className={itemClass(activeView === "loan-ledger")}>
              <BookOpen className="w-4 h-4 shrink-0" /> Active Loans
            </button>
            <button onClick={() => onViewChange("issue-loan")} className={itemClass(activeView === "issue-loan")}>
              <Scale className="w-4 h-4 shrink-0" /> Issue New Loan
            </button>
          </div>
        </div>

        <div>
          <p className={sectionLabel}>Sales</p>
          <div className="space-y-0.5">
            <button onClick={() => onViewChange("sales-ledger")} className={itemClass(activeView === "sales-ledger")}>
              <ShoppingBag className="w-4 h-4 shrink-0" /> Sales Ledger
            </button>
          </div>
        </div>

        <div>
          <p className={sectionLabel}>Inventory</p>
          <div className="space-y-2">
            
            {/* GOLD INVENTORY TOGGLE */}
            <div>
              <button onClick={() => setGoldOpen((v) => !v)} className={itemClass(false)}>
                <div className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
                <span className="flex-1 text-left">Gold Inventory</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", goldOpen && "rotate-180")} />
              </button>
              {goldOpen && <CategoryTree categories={GOLD_CATEGORIES} />}
            </div>

            {/* SILVER INVENTORY TOGGLE */}
            <div>
              <button onClick={() => setSilverOpen((v) => !v)} className={itemClass(false)}>
                <div className="w-3 h-3 rounded-full bg-slate-300 shrink-0" />
                <span className="flex-1 text-left">Silver Inventory</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", silverOpen && "rotate-180")} />
              </button>
              {silverOpen && <CategoryTree categories={SILVER_CATEGORIES} />}
            </div>

          </div>
        </div>

        <div>
          <p className={sectionLabel}>System</p>
          <button onClick={() => onViewChange("settings")} className={itemClass(activeView === "settings")}>
            <Settings className="w-4 h-4 shrink-0" /> Settings
          </button>
        </div>
      </nav>

      <div className="m-3 p-3 rounded-xl bg-surface-2/60 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gold-soft text-gold flex items-center justify-center text-sm font-semibold">
          AR
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-foreground truncate">Atharv Rastogi</p>
          <p className="text-[11px] text-muted-foreground truncate">Lohai Road</p>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Sign out">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};