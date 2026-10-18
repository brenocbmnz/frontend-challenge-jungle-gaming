import { test, expect } from "@playwright/test";
import { start, login, add } from "./helpers";

test.beforeEach(async ({ page }) => {
  await start(page);
});

test("filtro selecionado muda a cor sem acrescentar checkmark visual", async ({
  page,
}, info) => {
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Filtros", exact: true }).click();
  const scope =
    info.project.name === "mobile"
      ? page.getByRole("dialog")
      : page.locator(".catalog-sidebar");
  const checkbox = scope.getByLabel("Fotografia", { exact: false });
  const label = checkbox.locator("..");
  const initial = await label.evaluate((el) => getComputedStyle(el).color);
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  await expect(label).not.toHaveCSS("color", initial);
  expect(
    await label
      .locator("span")
      .evaluate((el) => getComputedStyle(el, "::before").content),
  ).toMatch(/^(none|normal|"")$/);
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).not.toBeChecked();
  await expect(label).toHaveCSS("color", initial);
});

test("raridade vem da API e acompanha o NFT após busca e ordenação", async ({
  page,
}) => {
  await expect(
    page
      .locator(".nft-card")
      .filter({ has: page.locator('a[href="/nft/3"]') })
      .getByText("RARO", { exact: true }),
  ).toBeVisible();
  await page.goto("/?q=Neon");
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(4);
  await expect(
    page.locator(".nft-grid .nft-card").first().locator("a"),
  ).toHaveAttribute("href", "/nft/3");
  await expect(
    page
      .locator(".nft-grid .nft-card")
      .first()
      .getByText("RARO", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".nft-grid .nft-card")
      .nth(2)
      .getByText("RARO", { exact: true }),
  ).toHaveCount(0);
  await page.goto("/?q=Sage");
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(4);
  await expect(page.locator(".nft-grid .catalog-rarity")).toHaveCount(0);
  await page.goto("/?sort=price-asc&page=2");
  const mobile = page.viewportSize()!.width <= 768;
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(mobile ? 6 : 9);
  const data = await page.evaluate(async (mobile) => {
    const response = await fetch(
      `/api/nfts?sort=price-asc&page=2${mobile ? "&pageSize=6" : ""}`,
    );
    return response.json() as Promise<{
      items: { id: string; rarity: string }[];
    }>;
  }, mobile);
  expect(data.items.some((nft) => nft.rarity === "rare")).toBe(true);
  for (const nft of data.items) {
    const card = page
      .locator(".nft-grid .nft-card")
      .filter({ has: page.locator(`a[href="/nft/${nft.id}"]`) });
    if (nft.rarity === "rare")
      await expect(card.getByText("RARO", { exact: true })).toBeVisible();
    else await expect(card.locator(".catalog-rarity")).toHaveCount(0);
  }
});

test("favorito do card usa hover e teclado no desktop e fica oculto no mobile", async ({
  page,
}, info) => {
  await login(page);
  await page.goto("/");
  const card = page.locator(".nft-grid .nft-card").nth(1);
  const favorite = card.locator(".catalog-favorite");
  if (info.project.name === "mobile") {
    for (const width of [390, 683, 768]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(favorite).toBeHidden();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/nft/2");
    const detailFavorite = page.locator(".mobile-product-actions button");
    await detailFavorite.click();
    await expect(detailFavorite).toHaveAttribute("aria-pressed", "true");
    return;
  }
  await expect(favorite).toHaveCSS("opacity", "0");
  await card.locator(".nft-art").hover();
  await expect(favorite).toHaveCSS("opacity", "1");
  await favorite.click();
  await expect(favorite).toHaveAttribute("aria-pressed", "true");
  await card.getByRole("heading").hover();
  await expect(favorite).toHaveCSS("opacity", "0");
  await page.keyboard.press("Tab");
  await card.locator("a").focus();
  await expect(favorite).toHaveCSS("opacity", "1");
  await page.keyboard.press("Tab");
  await expect(favorite).toBeFocused();
  await page.keyboard.press("Space");
  await expect(favorite).toHaveAttribute("aria-pressed", "false");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(favorite).toHaveCSS("transition-duration", "0s");
});

test("dados anteriores recebem raridade sem apagar o carrinho", async ({
  page,
}) => {
  await add(page);
  await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem("kurio.mock.v1")!);
    for (const nft of db.nfts) delete nft.rarity;
    localStorage.setItem("kurio.mock.v1", JSON.stringify(db));
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
  const state = await page.evaluate(async () => {
    const guest = localStorage.getItem("kurio.guest")!;
    const cart = await fetch("/api/cart", {
      headers: { "X-Guest-Id": guest },
    }).then((response) => response.json());
    const nft = await fetch("/api/nfts/3").then((response) => response.json());
    return { cart, nft };
  });
  expect(state.cart.items).toHaveLength(1);
  expect(state.cart.items[0].nftId).toBe("1");
  expect(state.nft.rarity).toBe("rare");
});
