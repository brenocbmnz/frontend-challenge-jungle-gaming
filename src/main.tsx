import "./styles.css";
import "./design-refinements.css";
import "./interactions.css";

async function bootstrap() {
  const prepareMocks = async () => {
    if (import.meta.env.VITE_ENABLE_MOCKS !== "false") {
      const { startMocks } = await import("./mocks/browser");
      await startMocks();
    }
  };
  // Keep React's runtime off the entry's critical path while the worker starts.
  const [, { mountApplication }] = await Promise.all([
    prepareMocks(),
    import("./app"),
  ]);
  mountApplication();
}
bootstrap().catch((error) => {
  document.getElementById("root")!.textContent =
    "Não foi possível iniciar a aplicação. Recarregue a página.";
  console.error(error);
});
