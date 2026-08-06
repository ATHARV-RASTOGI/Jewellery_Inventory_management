import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

// Shared query cache used by the entire app
const queryClient = new QueryClient();

// TanStack Router — file-based routing powered by routeTree.gen.ts
const router = createRouter({
  routeTree,
  context: { queryClient },
});

// Type-safety: lets useRouter() / useNavigate() know our exact route tree
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Mount the app
const root = document.getElementById("root")!;
if (!root.innerHTML) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  );
}