import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import "./styles.css";
import { queryClient } from "./api/queries";
async function bootstrap() {
  const prepareMocks = async () => {
    if (import.meta.env.VITE_ENABLE_MOCKS !== "false") {
      const { startMocks } = await import("./mocks/browser");
      await startMocks();
    }
  };
  const [, { router }] = await Promise.all([
    prepareMocks(),
    import("./router"),
  ]);
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}
bootstrap().catch((error) => {
  document.getElementById("root")!.textContent =
    "Não foi possível iniciar a aplicação. Recarregue a página.";
  console.error(error);
});
