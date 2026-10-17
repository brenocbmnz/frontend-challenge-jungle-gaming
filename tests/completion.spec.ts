import { test, expect } from "@playwright/test";
import { start, add, login, checkout, control } from "./helpers";

test.beforeEach(async ({ page }) => {
  await start(page);
});

test("cupom expirado e remoção do desconto persistem após refresh", async ({
  page,
}) => {
  await add(page);
  await page.goto("/carrinho");
  await page
    .getByRole("textbox", { name: "Código promocional" })
    .fill("EXPIRED");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("expirou");
  await page
    .getByRole("textbox", { name: "Código promocional" })
    .fill("KURIO10");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(page.locator(".grand-total")).toContainText("1.087 ETH");
  await page.getByRole("button", { name: /Remover cupom/ }).click();
  await expect(page.locator(".grand-total")).toContainText("1.206 ETH");
  await page.reload();
  await expect(page.locator(".grand-total")).toContainText("1.206 ETH");
});

test("rede compatível troca carteira; conexão recusada recupera e desconecta", async ({
  page,
}) => {
  await add(page);
  await login(page, undefined, undefined, "/pagamento");
  await page.locator(".network-choice select:visible").selectOption("Polygon");
  await control(page, "scenario", { scenario: "wallet-refused" });
  await page
    .getByRole("button", { name: "Conectar carteira", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Conexão recusada");
  await control(page, "scenario", { scenario: "default" });
  await page
    .getByRole("button", { name: "Conectar carteira", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Revisar compra", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Reserva · Polygon");
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page
    .getByRole("button", { name: "Desconectar carteira", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Revisar compra", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Conecte a carteira");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("dados adicionais do checkout têm erros associados e são preservados no pedido", async ({
  page,
}, info) => {
  await add(page);
  await login(page, undefined, undefined, "/pagamento");
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: /Dados do colecionador/ }).click();
  const form = page.locator(".collector-form");
  await form
    .getByLabel("ENS ou carteira secundária (opcional)", { exact: true })
    .fill("inválida");
  await page
    .getByRole("button", { name: "Conectar carteira", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Revisar compra", exact: true })
    .click();
  const secondary = form.getByLabel("ENS ou carteira secundária (opcional)", {
    exact: true,
  });
  await expect(secondary).toHaveAttribute("aria-invalid", "true");
  await expect(secondary).toHaveAccessibleDescription(
    "Informe um endereço de carteira ou ENS válido.",
  );
  await secondary.fill("reserva.eth");
  await form
    .getByLabel("Observação do colecionador (opcional)")
    .fill("Entrega de teste");
  await page
    .getByRole("button", { name: "Revisar compra", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toBeVisible();
  const order = await page.evaluate(
    async () =>
      (
        await (
          await fetch("/api/orders", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("kurio.token")}`,
            },
          })
        ).json()
      )[0],
  );
  expect(order.collector.secondaryWallet).toBe("reserva.eth");
  expect(order.note).toBe("Entrega de teste");
  await expect(page.locator("#main-content")).toBeVisible();
});

test("edição da carteira principal e secundária persiste", async ({ page }) => {
  await login(page, undefined, undefined, "/carteiras");
  const primary = page.locator(".wallet-primary-form");
  await primary
    .getByLabel("Apelido da carteira", { exact: true })
    .fill("Principal atualizada");
  await primary
    .getByRole("button", { name: "Salvar carteira", exact: true })
    .click();
  await expect(page.getByText("Carteira salva com sucesso.")).toBeVisible();
  await page
    .locator(".wallet-card")
    .filter({ hasText: "Reserva" })
    .getByRole("button", { name: "Editar" })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Apelido da carteira", { exact: true })
    .fill("Reserva atualizada");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Salvar carteira", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(
    primary.getByLabel("Apelido da carteira", { exact: true }),
  ).toHaveValue("Principal atualizada");
  await expect(
    page.getByRole("heading", { name: "Reserva atualizada", exact: true }),
  ).toBeVisible();
});

test("mesma chave com payload diferente gera conflito sem duplicar pedido", async ({
  page,
}) => {
  await checkout(page);
  const result = await page.evaluate(async () => {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("kurio.token")}`,
    };
    const quote = await (await fetch("/api/quote", { headers })).json();
    const wallets = await (await fetch("/api/wallets", { headers })).json();
    const body = {
      quoteId: quote.id,
      walletId: wallets.find((w: { primary: boolean }) => w.primary).id,
      note: "original",
      collector: { name: "Nova", username: "nova", email: "nova@kurio.test" },
    };
    const invalid = await fetch("/api/orders", {
      method: "POST",
      headers: { ...headers, "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify({
        ...body,
        collector: { ...body.collector, secondaryWallet: "inválida" },
      }),
    });
    const invalidBody = await invalid.json();
    const key = crypto.randomUUID();
    const first = await fetch("/api/orders", {
      method: "POST",
      headers: { ...headers, "Idempotency-Key": key },
      body: JSON.stringify(body),
    });
    const conflict = await fetch("/api/orders", {
      method: "POST",
      headers: { ...headers, "Idempotency-Key": key },
      body: JSON.stringify({ ...body, note: "alterado" }),
    });
    const repeated = await fetch("/api/orders", {
      method: "POST",
      headers: { ...headers, "Idempotency-Key": key },
      body: JSON.stringify(body),
    });
    return {
      invalid: invalid.status,
      invalidField: invalidBody.fields?.secondaryWallet,
      first: first.status,
      conflict: conflict.status,
      firstOrder: (await first.json()).id,
      repeatedOrder: (await repeated.json()).id,
      orders: (await (await fetch("/api/orders", { headers })).json()).length,
    };
  });
  expect(result.invalid).toBe(422);
  expect(result.invalidField).toBe(
    "Informe um endereço de carteira ou ENS válido.",
  );
  expect(result.first).toBeLessThan(300);
  expect(result.conflict).toBe(409);
  expect(result.repeatedOrder).toBe(result.firstOrder);
  expect(result.orders).toBe(1);
});

test("telas privadas refluem em tablet, mobile e viewport equivalente a zoom", async ({
  page,
}) => {
  test.slow();
  await checkout(page);
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toBeVisible();
  const receipt = new URL(page.url()).pathname;
  for (const authPath of ["/login", "/cadastro", receipt]) {
    await page.goto(authPath);
    await expect(page.locator("#main-content")).toHaveCount(1);
    await page.getByRole("link", { name: "Pular para o conteúdo" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  }

  // 720 CSS px corresponds to 200% on 1440 px; 320 to 400% on 1280 px.
  for (const width of [390, 768, 1440, 720, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ["/perfil", "/carteiras", receipt, "/pagamento"]) {
      if (path === "/pagamento") await add(page);
      await page.goto(path);
      await expect(page.locator("main").last()).toBeVisible();
      await page.locator(".skeleton-grid").first().waitFor({ state: "hidden" });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `${path} at ${width}`,
      ).toBeLessThanOrEqual(width);
      if (path === "/pagamento") {
        const toggle = page.getByRole("button", {
          name: /Dados do colecionador/,
        });
        if (await toggle.isVisible()) await toggle.click();
        await expect(
          page
            .locator(".collector-form")
            .getByLabel("Nome de exibição", { exact: true }),
        ).toBeVisible();
      }
    }
  }
});
