import { test, expect } from "@playwright/test";
import { start, add, login } from "./helpers";
test("regressão visual das quatro telas principais", async ({ page }) => {
  await start(page);
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(9);
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot("inicio.png", { fullPage: true });
  await page.goto("/nft/1");
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot("detalhe.png", { fullPage: true });
  await add(page);
  await page.goto("/carrinho");
  await expect(page.locator(".cart-row")).toHaveCount(1);
  await expect(page).toHaveScreenshot("carrinho.png", { fullPage: true });
  await login(page, "nova@kurio.test", "Kurio123!", "/pagamento");
  await expect(
    page.getByRole("heading", { name: "Carteira selecionada" }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot("pagamento.png", { fullPage: true });
});
test("assets visíveis carregam e layout não tem overflow em 390, 768 e 1440", async ({
  page,
}) => {
  await start(page);
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ["/", "/nft/1", "/carrinho", "/login", "/cadastro"]) {
      await page.goto(path);
      await expect(page.locator("main").last()).toBeVisible();
      await page.evaluate(async () => {
        for (const img of document.images) {
          if (img.getBoundingClientRect().width > 0) {
            img.loading = "eager";
            try {
              await img.decode();
            } catch { /* A missing image is reported by the assertion below. */ }
          }
        }
      });
      const broken = await page
        .locator("img")
        .evaluateAll((images) =>
          images
            .filter(
              (img) =>
                img.getBoundingClientRect().width > 0 &&
                (!img.complete || !img.naturalWidth),
            )
            .map((img) => img.getAttribute("src")),
        );
      expect(broken).toEqual([]);
      const sizes = await page.evaluate(() => ({
        content: document.documentElement.scrollWidth,
        viewport: innerWidth,
      }));
      expect(sizes.content, `${path} at ${width}`).toBeLessThanOrEqual(
        sizes.viewport,
      );
    }
  }
});
