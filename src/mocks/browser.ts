import { setupWorker } from "msw/browser";
import { initialize } from "./database";
import { handlers } from "./handlers";
import { socketHandler } from "./realtime";
export async function startMocks() {
  await initialize();
  const worker = setupWorker(...handlers, socketHandler);
  await worker.start({
    serviceWorker: { url: "/apiMockServiceWorker.js" },
    onUnhandledRequest: "bypass",
    quiet: true,
  });
  return worker;
}
