import { useState } from "react";
import { AppProviders } from "./providers";
import { CategorySidebar } from "./features/inventory/components/CategorySidebar";
import { TopStatsBar } from "./components/layout/TopStatsBar";
import { ProductGrid } from "./features/inventory/components/ProductGrid";
import { LoanIssueForm } from "./features/loans/components/LoanIssueForm";
import { LoanLedger } from "./features/loans/components/LoanLedger";

type View = "loan-ledger" | "issue-loan" | (string & {});

export default function App() {
  const [currentView, setCurrentView] = useState<View>("loan-ledger");

  const renderMainContent = () => {
    switch (currentView) {
      case "loan-ledger":
        return <LoanLedger />;
      case "issue-loan":
        return <LoanIssueForm />;
      default:
        return <ProductGrid activeCategory={currentView} />;
    }
  };

  return (
    <AppProviders>
      <div className="h-screen w-full bg-obsidian flex overflow-hidden font-sans text-slate-200">

        <CategorySidebar activeView={currentView} onViewChange={setCurrentView} />

        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
  <div className="flex-1 flex flex-col overflow-hidden p-6 z-10">
    <div className="shrink-0">
      <TopStatsBar />
      <div className="w-full h-px bg-gradient-to-r from-gold-muted via-gold/20 to-transparent mb-6" />
    </div>
    <div className="flex-1 min-h-0 relative">
      {renderMainContent()}
    </div>
  </div>
</main>

      </div>
    </AppProviders>
  );
}