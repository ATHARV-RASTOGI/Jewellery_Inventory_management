import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/auth/LoginPage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "K.K Jewellers — Counter Login" },
      {
        name: "description",
        content: "Secure counter terminal login for K.K Jewellers ERP.",
      },
    ],
  }),
  component: LoginPage,
});
