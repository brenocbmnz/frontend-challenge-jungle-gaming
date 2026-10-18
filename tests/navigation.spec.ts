import { test, expect } from "@playwright/test";
import { start, control } from "./helpers";

test.beforeEach(async ({ page }) => {
  await start(page);
});

test("menus preservam documento e filtros, com rolagem suave e movimento reduzido", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 600 });
  await page.goto("/?page=2");
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(9);
  const origin = await page.evaluate(() => performance.timeOrigin);
  await page.evaluate(() => {
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (options) {
      document.documentElement.dataset.sectionScroll =
        typeof options === "object" ? options.behavior || "auto" : "auto";
      return original.call(this, options);
    };
  });
  const nav = page.getByRole("navigation", { name: "Navegação principal" });
  for (const [label, hash] of [
    ["Criadores", "criadores"],
    ["Aprenda", "diario"],
    ["Mercado", "catalogo"],
    ["Início", "inicio"],
  ]) {
    await nav.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`page=2#${hash}$`));
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.dataset.sectionScroll),
      )
      .toBe("smooth");
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await nav.getByRole("link", { name: "Aprenda", exact: true }).click();
  await expect(page).toHaveURL(/#diario$/);
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.dataset.sectionScroll),
    )
    .toBe("instant");
  await expect
    .poll(() =>
      page
        .locator("#diario")
        .evaluate((el) => Math.round(el.getBoundingClientRect().top)),
    )
    .toBe(24);
  await page.goto("/nft/1");
  await page
    .getByRole("heading", { name: "Emerald Ape #042", exact: true })
    .waitFor();
  await nav.getByRole("link", { name: "Criadores", exact: true }).click();
  await expect(page).toHaveURL(/\/#criadores$/);
  await expect(page.locator("#criadores")).toBeInViewport();
});

test("paginação mantém posição e cards durante a consulta em viewport baixa", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 600 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await control(page, "scenario", { scenario: "slow" });
  const pagination = page.getByRole("navigation", { name: "Paginação" });
  await pagination.scrollIntoViewIfNeeded();
  const position = await page.evaluate(() => scrollY);
  const first = await page
    .locator(".nft-grid .nft-card > a")
    .first()
    .getAttribute("href");
  await pagination
    .getByRole("button", { name: "Página 2", exact: true })
    .click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator(".nft-grid")).toHaveAttribute("aria-busy", "true");
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(9);
  expect(
    Math.abs((await page.evaluate(() => scrollY)) - position),
  ).toBeLessThanOrEqual(2);
  await expect(page.locator(".nft-grid")).toHaveAttribute("aria-busy", "false");
  await expect(
    page.locator(".nft-grid .nft-card > a").first(),
  ).not.toHaveAttribute("href", first!);
  expect(
    Math.abs((await page.evaluate(() => scrollY)) - position),
  ).toBeLessThanOrEqual(2);
  await pagination
    .getByRole("button", { name: "Página 3", exact: true })
    .click();
  await expect(page.locator(".nft-grid")).toHaveAttribute("aria-busy", "false");
  await page.goBack();
  await expect(pagination.locator("[aria-current]")).toHaveText("2");
  expect(
    Math.abs((await page.evaluate(() => scrollY)) - position),
  ).toBeLessThanOrEqual(2);
});

test("resposta de carrinho sem items não derruba o cabeçalho e permite recuperação", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // A persisted malformed fixture reproduces a 200 response without cart items.
  await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem("kurio.mock.v1")!);
    db.carts[`guest:${localStorage.getItem("kurio.guest")}`] = { coupon: "" };
    localStorage.setItem("kurio.mock.v1", JSON.stringify(db));
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: /SEJA DONO/ })).toBeVisible();
  await expect(page.locator(".cart-link")).toHaveAttribute(
    "aria-label",
    "Carrinho, 0 itens",
  );
  await page.goto("/carrinho");
  await expect(page.getByRole("alert")).toContainText(
    "Não foi possível carregar o carrinho",
  );
  await control(page, "reset", { scenario: "default" });
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Seu carrinho está vazio" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
