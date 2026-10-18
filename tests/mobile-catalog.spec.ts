import { test, expect } from "@playwright/test";
import { start, control } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
});

test("mobile troca páginas de seis sem saltos e preserva URL e histórico", async ({
  page,
}) => {
  const cards = page.locator(".nft-grid .nft-card");
  const pagination = page.getByRole("navigation", { name: "Paginação" });
  await expect(cards).toHaveCount(6);
  await expect(
    pagination.getByRole("button", { name: /^Página [0-9]+$/ }),
  ).toHaveCount(6);
  await control(page, "scenario", { scenario: "slow" });
  await pagination.scrollIntoViewIfNeeded();
  const position = await page.evaluate(() => scrollY);
  await pagination
    .getByRole("button", { name: "Página 2", exact: true })
    .click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator(".nft-grid")).toHaveAttribute("aria-busy", "true");
  await expect(cards).toHaveCount(6);
  await expect(cards.first().locator("a")).toHaveAttribute("href", "/nft/1");
  await expect(cards.first().locator("a")).toHaveAttribute("href", "/nft/7");
  expect(
    Math.abs((await page.evaluate(() => scrollY)) - position),
  ).toBeLessThanOrEqual(2);
  await control(page, "scenario", { scenario: "default" });
  await page.goBack();
  await expect(pagination.locator("[aria-current]")).toHaveText("1");
  await expect(cards.first().locator("a")).toHaveAttribute("href", "/nft/1");
  await page.goto("/?page=6");
  await expect(cards).toHaveCount(6);
  await expect(cards.first().locator("a")).toHaveAttribute("href", "/nft/31");
  await expect(
    pagination.getByRole("button", { name: "Próxima página" }),
  ).toBeDisabled();
  await page.reload();
  await expect(cards.first().locator("a")).toHaveAttribute("href", "/nft/31");
  await expect(cards).toHaveCount(6);
  await page.setViewportSize({ width: 1024, height: 844 });
  await expect(page).toHaveURL(/page=4/);
  await expect(cards).toHaveCount(9);
  await expect(cards.first().locator("a")).toHaveAttribute("href", "/nft/28");
});

test("catálogo limita seis itens no mobile, mantém nove no desktop e não carrega ao rolar", async ({
  page,
}) => {
  const cards = page.locator(".nft-grid .nft-card");
  for (const width of [390, 683, 768, 1024]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(cards).toHaveCount(width <= 768 ? 6 : 9);
    await page.locator(".footer").scrollIntoViewIfNeeded();
    await expect(page.locator(".nft-grid")).toHaveAttribute(
      "aria-busy",
      "false",
    );
    await expect(cards).toHaveCount(width <= 768 ? 6 : 9);
    await expect(page).not.toHaveURL(/page=/);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?q=Neon");
  await expect(cards).toHaveCount(4);
  await expect(
    page.getByRole("button", { name: "Página 2", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".catalog-load-more")).toHaveCount(0);
});

test("barra de compra compacta mantém controles legíveis e menu usa recorte sem bola preta", async ({
  page,
}) => {
  const nav = page.locator(".bottom-nav");
  expect(
    await nav
      .locator(".scan-link")
      .evaluate((link) => getComputedStyle(link).boxShadow),
  ).toBe("none");
  expect(
    await nav.evaluate(
      (el) =>
        getComputedStyle(el, "::before").clipPath !== "none" ||
        getComputedStyle(el, "::before").maskImage !== "none",
    ),
  ).toBe(true);
  for (const width of [320, 390, 683, 768]) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto("/nft/1");
    const bar = page.locator(".product-purchase");
    await expect(bar).toBeVisible();
    const box = (await bar.boundingBox())!;
    expect(box.height).toBe(140);
    expect(box.y + box.height).toBe(700);
    const minus = bar.getByRole("button", { name: "Diminuir quantidade" });
    await expect(minus).toBeDisabled();
    await expect(minus).toHaveCSS("opacity", "1");
    await expect(minus).toHaveCSS("border-top-width", "0px");
    await bar.getByRole("button", { name: "Aumentar quantidade" }).click();
    await expect(minus).toBeEnabled();
    await minus.click();
    await expect(minus).toBeDisabled();
    await expect(
      bar.getByRole("button", { name: "Comprar NFT", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
});
