import { expect, type Page } from "@playwright/test";
export async function control(page: Page, path: string, body: unknown) {
  await expect(
    page.getByRole("status", { name: "Carregando aplicação" }),
  ).toHaveCount(0);
  return page.evaluate(
    async ({ path, body }) => {
      const r = await fetch("/__mock/" + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return r.json();
    },
    { path, body },
  );
}
export async function start(page: Page, scenario = "default") {
  await page.clock.install({ time: new Date("2026-10-17T15:00:00Z") });
  await page.goto("/");
  await expect(page.locator(".nft-card").first()).toBeVisible({
    timeout: 30000,
  });
  await control(page, "reset", { scenario });
  await page.evaluate(() => {
    localStorage.removeItem("kurio.token");
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: /SEJA DONO/ })).toBeVisible();
}
export async function login(
  page: Page,
  email = "nova@kurio.test",
  password = "Kurio123!",
  redirect = "/perfil",
) {
  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`);
  await page.getByRole("textbox", { name: "E-mail", exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
export async function add(page: Page) {
  await page.goto("/nft/1");
  await page
    .getByRole("button", { name: /^(COMPRAR|Comprar NFT)$/, exact: true })
    .click();
  await expect(page.getByText("Item adicionado. Ver carrinho")).toBeVisible();
}
export async function checkout(page: Page) {
  await add(page);
  await login(page, "nova@kurio.test", "Kurio123!", "/pagamento");
  await expect(
    page.getByRole("heading", { name: "Carteira selecionada" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Conectar carteira", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Desconectar carteira" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Revisar compra", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Revise sua compra" }),
  ).toBeVisible();
}

export async function logout(page: Page) {
  const exit = page.getByRole("button", { name: "Sair", exact: true });
  if (page.viewportSize()!.width <= 768 && !(await exit.isVisible())) {
    await page
      .getByRole("button", { name: "Menu da conta", exact: true })
      .click();
  }
  await exit.click();
}
