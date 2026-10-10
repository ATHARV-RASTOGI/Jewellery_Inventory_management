import { createFileRoute, Navigate } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/layout/DashboardShell";
import { useAuth } from "@/lib/authContext";
import { Gem } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "K.K Jewellers — Dashboard" },
      {
        name: "description",
        content:
          "Minimal inventory and loan management dashboard for K.K Jewellers, Lohai Road.",
      },
      { property: "og:title", content: "K.K Jewellers — Dashboard" },
      {
        property: "og:description",
        content:
          "Inventory and loan management dashboard for K.K Jewellers, Nehru Road.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-amber-500 animate-pulse">
            <Gem className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground animate-pulse">
            Verifying counter session...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardShell />;
}
