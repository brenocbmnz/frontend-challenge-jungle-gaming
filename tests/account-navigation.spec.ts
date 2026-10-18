import { test, expect } from "@playwright/test";
import { start, login, logout } from "./helpers";

test.beforeEach(async ({ page }) => {
  await start(page);
});

test("paginação de resultado único não mostra seta", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: "Próxima página", exact: true }),
  ).toBeVisible();
  await page.goto("/?q=Neon");
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(4);
  await expect(
    page.getByRole("button", { name: "Página 1", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Próxima página", exact: true }),
  ).toHaveCount(0);
});

test("menu mobile da conta abre em lista, indica a seção e fecha com Escape ou navegação", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const toggle = page.getByRole("button", {
    name: "Menu da conta",
    exact: true,
  });
  const links = page.getByRole("navigation", { name: "Conta do colecionador" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(links).not.toBeVisible();
  const heading = page.getByRole("heading", {
    name: "Perfil do colecionador",
    exact: true,
  });
  const before = (await heading.boundingBox())!;
  await toggle.click();
  await expect(links).toHaveCSS("position", "absolute");
  expect((await heading.boundingBox())!.y).toBe(before.y);
  await page.mouse.click(380, 500);
  await expect(links).not.toBeVisible();
  expect((await heading.boundingBox())!.y).toBe(before.y);
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(
    links.getByRole("link", { name: "Dados do perfil", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Tab");
  await expect(
    links.getByRole("link", { name: "Dados do perfil", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(links).not.toBeVisible();
  await toggle.click();
  const boxes = await links.getByRole("link").evaluateAll((items) =>
    items.map((item) => {
      const { x, y, width, height } = item.getBoundingClientRect();
      return { x, y, width, height };
    }),
  );
  for (let i = 0; i < boxes.length; i++) {
    expect(boxes[i].height).toBeGreaterThanOrEqual(44);
    expect(boxes[i].width).toBeGreaterThan(250);
    if (i)
      expect(boxes[i].y).toBeGreaterThanOrEqual(
        boxes[i - 1].y + boxes[i - 1].height,
      );
  }
  await links.getByRole("link", { name: "Carteiras", exact: true }).click();
  await expect(page).toHaveURL(/\/carteiras/);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toContainText("Carteiras");
  await expect(page.locator(".mobile-title h1")).toHaveText("Carteiras");
  await expect(page.locator(".header")).not.toBeVisible();
  await expect(
    page.locator(".mobile-title").getByRole("link", { name: "Voltar" }),
  ).toHaveAttribute("href", "/");
  await toggle.click();
  await links
    .getByRole("link", { name: "Lista de interesse", exact: true })
    .click();
  await expect(page).toHaveURL(/\/favoritos/);
  await expect(page.locator(".mobile-title h1")).toHaveText(
    "Lista de interesse",
  );
  await expect(page.locator(".header")).not.toBeVisible();
  await page
    .locator(".mobile-title")
    .getByRole("link", { name: "Voltar" })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/carteiras");
  await logout(page);
  await expect(page).toHaveURL(/\/$/);
});

test("desktop preserva a lateral e o editor; cabeçalho usa Perfil e mobile não repete avatar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  const header = page.locator(".header .user-avatar");
  const preview = page.locator('.avatar-field img[alt="Seu avatar"]');
  await expect(
    page.getByRole("button", { name: "Menu da conta", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Conta do colecionador" }),
  ).toBeVisible();
  const profile = page
    .locator(".header")
    .getByRole("link", { name: "Perfil", exact: true });
  await expect(profile).toHaveText("Perfil");
  await expect(profile).toHaveCSS("font-family", /Roboto Mono/);
  await expect(page.locator(".avatar-placeholder")).toBeVisible();
  await expect(header).toHaveCSS("border-radius", "50%");
  await expect(header.locator("svg")).toBeVisible();
  await page.locator("#avatar").setInputFiles("public/assets/8f387-320.webp");
  await expect(preview).toBeVisible();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  const avatar = await preview.getAttribute("src");
  await expect(header.locator("img")).toHaveAttribute("src", avatar!);
  await page.reload();
  await expect(header.locator("img")).toHaveAttribute("src", avatar!);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".header .account-link")).toHaveCount(0);
  await expect(page.locator(".header-actions > *")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Menu da conta", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".account-mobile-toggle .user-avatar img"),
  ).toHaveAttribute("src", avatar!);
  await expect(page.locator(".avatar-field .user-avatar img")).toHaveAttribute(
    "src",
    avatar!,
  );
  await page.getByRole("button", { name: "Remover", exact: true }).click();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(
    page.locator(".account-mobile-toggle .user-avatar svg"),
  ).toBeVisible();
  await logout(page);
  await login(page, "breno@kurio.test");
  await expect(page.locator(".avatar-field .user-avatar svg")).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(header.locator("svg")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Menu da conta", exact: true }),
  ).toHaveCount(0);
});

test("botão central usa rolagem suave e respeita movimento reduzido sem perder busca", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?q=Neon");
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(4);
  await page.evaluate(() => {
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (options) {
      if (this.id === "catalogo")
        document.documentElement.dataset.catalogScroll =
          typeof options === "object" ? options.behavior || "auto" : "auto";
      return original.call(this, options);
    };
  });
  const explore = page.getByRole("link", {
    name: "Explorar catálogo",
    exact: true,
  });
  await explore.click();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.dataset.catalogScroll),
    )
    .toBe("smooth");
  await expect(page).toHaveURL(/q=Neon#catalogo/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await explore.click();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.dataset.catalogScroll),
    )
    .toBe("instant");
  await expect(page).toHaveURL(/q=Neon#catalogo/);
});

test("Salvar acompanha scroll mobile, mostra confirmação e mantém desktop no fluxo", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await login(page);
  const actions = page.locator(".profile-save-actions");
  const save = actions.getByRole("button", { name: "Salvar", exact: true });
  await expect(actions).toHaveCount(0);
  await expect(page.locator(".mobile-title h1")).toHaveText("Perfil");
  await expect(
    page.locator(".mobile-title").getByRole("link", { name: "Voltar" }),
  ).toHaveAttribute("href", "/");
  const name = page.getByRole("textbox", {
    name: "Nome de exibição",
    exact: false,
  });
  const originalName = await name.inputValue();
  await name.fill("Alteração temporária");
  await expect(save).toBeVisible();
  await name.fill(originalName);
  await expect(actions).toHaveCount(0);
  await name.fill("Nova com ação flutuante");
  await expect(actions).toHaveCSS("position", "fixed");
  await expect(actions).toHaveCSS("opacity", "1");
  await expect(save).toBeInViewport();
  const before = (await save.boundingBox())!;
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  expect(
    Math.abs((await save.boundingBox())!.y - before.y),
  ).toBeLessThanOrEqual(1);
  const lastInput = (await page
    .getByLabel("Confirmar nova senha", { exact: true })
    .boundingBox())!;
  expect(lastInput.y + lastInput.height).toBeLessThanOrEqual(
    (await actions.boundingBox())!.y,
  );
  await page
    .getByRole("textbox", { name: "Nome de exibição", exact: false })
    .fill("Nova com ação flutuante");
  await save.click();
  await expect(page.getByRole("status")).toHaveText(
    "Perfil salvo com sucesso.",
  );
  await expect(actions).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Nome de exibição", exact: false }),
  ).toHaveValue("Nova com ação flutuante");
  await name.fill("Outra alteração");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(actions).toHaveCSS("animation-name", "none");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(actions).toHaveCSS("position", "static");
});
