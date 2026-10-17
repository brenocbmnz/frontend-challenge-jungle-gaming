import fs from "node:fs/promises";

await fs.access("playwright-report/index.html");
await fs.rm("reports/playwright", { recursive: true, force: true });
await fs.mkdir("reports/playwright", { recursive: true });
await fs.cp("playwright-report", "reports/playwright", { recursive: true });
console.log("Relatório disponível em reports/playwright/index.html");
