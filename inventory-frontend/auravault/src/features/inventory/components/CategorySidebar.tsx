import { useState } from "react";
import { ChevronDown, Gem, BookOpen, Scale } from "lucide-react";
import { INVENTORY_CATEGORIES } from "../../../lib/constants";
import { cn } from "../../../lib/utils";

type Props = {
  activeView: string;
  onViewChange: (id: string) => void;
};

export const CategorySidebar = ({ activeView, onViewChange }: Props) => {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({ rings: true });

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCategoryClick = (id: string, hasSub: boolean) => {
    if (hasSub) {
      toggleCategory(id);
    } else {
      onViewChange(id);
    }
  };

  const navItemClass = (id: string) =>
    cn(
      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
      activeView === id
        ? "bg-gold-muted/20 border border-gold/30 text-gold-light"
        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
    );

  return (
    <aside className="w-64 h-full bg-obsidian-light border-r border-gold-muted flex flex-col select-none">

      <div className="p-6 border-b border-gold-muted/50">
        <div className="flex items-center gap-2">
          <Gem className="w-5 h-5 text-gold shrink-0" />
          <h2 className="text-xl font-serif text-gold-light tracking-wide">K.K Jewellers</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1.5 pl-7 font-mono tracking-wide">Nehru Road , Farrukhabad</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-5">

        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-2 px-2">Ledger & Loans</p>
          <div className="space-y-0.5">
            <button onClick={() => onViewChange("loan-ledger")} className={navItemClass("loan-ledger")}>
              <BookOpen className="w-4 h-4 shrink-0" />
              Active Loans Ledger
            </button>
            <button onClick={() => onViewChange("issue-loan")} className={navItemClass("issue-loan")}>
              <Scale className="w-4 h-4 shrink-0" />
              Issue New Loan
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-2 px-2">Shop Inventory</p>
          <div className="space-y-0.5">
            {INVENTORY_CATEGORIES.map((category) => {
              const hasSub = !!category.subcategories?.length;
              const isOpen = !!openCategories[category.id];
              const isActive = activeView === category.id;
              const hasActiveSub = category.subcategories?.some((s) => s.id === activeView);

              return (
                <div key={category.id}>
                  <button
                    onClick={() => handleCategoryClick(category.id, hasSub)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive && !hasSub
                        ? "bg-gold-muted/20 border border-gold/30 text-gold-light"
                        : hasActiveSub
                        ? "text-gold/70"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    )}
                  >
                    <span className="text-base leading-none">{category.icon}</span>
                    <span className="flex-1 text-left">{category.name}</span>
                    {hasSub && (
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 transition-transform duration-200 shrink-0",
                          isOpen ? "rotate-0 text-gold" : "-rotate-90 text-slate-600"
                        )}
                      />
                    )}
                  </button>

                  {hasSub && isOpen && (
                    <div className="ml-3 pl-3 border-l border-gold-muted/30 mt-0.5 mb-1 space-y-0.5">
                      {category.subcategories!.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => onViewChange(sub.id)}
                          className={cn(
                            "w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-all duration-150",
                            activeView === sub.id
                              ? "text-gold bg-gold-muted/15 font-medium"
                              : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                          )}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </nav>

      <div className="p-4 border-t border-gold-muted/30">
        <div className="flex items-center gap-3 px-2">
          <div className="w-7 h-7 rounded-full bg-gold-muted/20 border border-gold/20 flex items-center justify-center text-xs text-gold font-medium shrink-0">
            M
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-300 truncate">Admin</p>
            <p className="text-xs text-slate-600 truncate">Lohai Road, Jhansi</p>
          </div>
        </div>
      </div>

    </aside>
  );
};