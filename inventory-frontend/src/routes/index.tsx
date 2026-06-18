import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

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
  return <DashboardShell />;
}
