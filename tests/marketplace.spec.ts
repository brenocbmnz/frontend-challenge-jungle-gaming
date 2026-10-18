import { test, expect } from "@playwright/test";
import { start, login, add, checkout, control } from "./helpers";
test.beforeEach(async ({ page }) => {
  await start(page);
});
test("catálogo compõe filtros, ordenação, paginação e histórico", async ({
  page,
}, info) => {
  await page.getByRole("button", { name: "Página 2", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Filtros", exact: true }).click();
  if (info.project.name === "mobile") {
    await page
      .getByRole("dialog")
      .getByLabel("Ordenar resultados")
      .selectOption("price-asc");
  } else {
    await page.getByLabel("Ordenar NFTs").selectOption("price-asc");
  }
  await expect(page).not.toHaveURL(/[?&]page=/);
  const scope =
    info.project.name === "mobile"
      ? page.getByRole("dialog")
      : page.locator(".catalog-sidebar");
  await scope.getByLabel("Arte digital", { exact: false }).check();
  await scope.getByLabel("Ethereum", { exact: false }).check();
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Ver resultados" }).click();
  await expect(page).toHaveURL(/categories/);
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(4);
  await page.reload();
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(4);
  await page.goBack();
  await expect
    .poll(() =>
      JSON.parse(new URL(page.url()).searchParams.get("networks") || "[]"),
    )
    .toEqual([]);
});
test("URL omite padrões, normaliza links antigos e preserva filtros ativos", async ({
  page,
}) => {
  await expect.poll(() => new URL(page.url()).search).toBe("");
  await page.goto(
    "/?q=&categories=%5B%5D&networks=%5B%5D&min=&max=&sort=recent&page=1&tab=all",
  );
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(
    page.viewportSize()!.width <= 768 ? 6 : 9,
  );
  await expect.poll(() => new URL(page.url()).search).toBe("");
  await page.getByRole("button", { name: "Página 2", exact: true }).click();
  await expect.poll(() => new URL(page.url()).search).toBe("?page=2");
  await page.reload();
  await expect(page.locator(".pagination [aria-current]")).toHaveText("2");
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(
    page.viewportSize()!.width <= 768 ? 6 : 9,
  );
  await page.goto("/");
  await expect.poll(() => new URL(page.url()).search).toBe("");
  await page.goto("/?q=Emerald&sort=price-asc");
  await expect(page.locator(".nft-grid .nft-card").first()).toContainText(
    "Emerald",
  );
  const search = new URL(page.url()).searchParams;
  expect(search.get("q")).toBe("Emerald");
  expect(search.get("sort")).toBe("price-asc");
  expect([...search.keys()].sort()).toEqual(["q", "sort"]);
  await page.reload();
  await expect(page.locator(".nft-grid .nft-card").first()).toContainText(
    "Emerald",
  );
});
test("busca e resultado vazio", async ({ page }) => {
  await page.getByRole("button", { name: "Buscar NFTs", exact: true }).click();
  await page.getByRole("textbox", { name: "Nome do NFT" }).fill("inexistente");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Buscar", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Nenhum NFT encontrado" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/q=inexistente/);
  await page.getByRole("button", { name: "Limpar busca e filtros" }).click();
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(
    page.viewportSize()!.width <= 768 ? 6 : 9,
  );
});
test("acesso direto ao detalhe e NFT inexistente", async ({ page }) => {
  await page.goto("/nft/1");
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "ABERTA", exact: true }),
  ).toBeDisabled();
  await page.goto("/nft/unknown");
  await expect(page.getByRole("alert")).toContainText("NFT não encontrado");
  await page.goto("/rota-inexistente");
  await expect(
    page.getByRole("heading", { name: "Página não encontrada" }),
  ).toBeVisible();
});
test("carrinho preserva quantidades e cupom após refresh e login", async ({
  page,
}) => {
  await add(page);
  await page.goto("/carrinho");
  await page.getByRole("button", { name: "Aumentar quantidade" }).click();
  await expect(page.locator(".grand-total")).toContainText("2.396 ETH");
  await page
    .getByRole("textbox", { name: "Código promocional" })
    .fill("INVALID");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Cupom inválido");
  await page
    .getByRole("textbox", { name: "Código promocional" })
    .fill("KURIO10");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(page.locator(".grand-total")).toContainText("2.158 ETH");
  await page.reload();
  await expect(page.locator(".grand-total")).toContainText("2.158 ETH");
  await login(page, "nova@kurio.test", "Kurio123!", "/carrinho");
  await expect(page.locator(".grand-total")).toContainText("2.158 ETH");
  await page.getByRole("button", { name: "Remover Emerald Ape #042" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu carrinho está vazio" }),
  ).toBeVisible();
});
test("compra completa e recibo estável após alteração no catálogo", async ({
  page,
}) => {
  await checkout(page);
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toBeVisible();
  await expect(page.locator(".receipt")).toContainText("1.206 ETH");
  await expect(page.locator(".toast")).not.toContainText(
    "Revise seu carrinho antes de comprar",
  );
  const initialViewport = page.viewportSize()!;
  for (const height of [1000, 600]) {
    await page.setViewportSize({ width: initialViewport.width, height });
    const box = await page.locator(".receipt").boundingBox();
    expect(box).not.toBeNull();
    expect(
      Math.abs(box!.x + box!.width / 2 - initialViewport.width / 2),
    ).toBeLessThanOrEqual(1);
    if (box!.height + 96 <= height) {
      expect(
        Math.abs(box!.y + box!.height / 2 - height / 2),
      ).toBeLessThanOrEqual(1);
    } else {
      expect(box!.y).toBeGreaterThanOrEqual(16);
    }
  }
  await page.setViewportSize(initialViewport);
  const url = page.url();
  await control(page, "event", { type: "price", id: "1" });
  await page.reload();
  await expect(page.locator(".receipt")).toContainText("1.206 ETH");
  await expect(page).toHaveURL(url);
  await page.goto("/carrinho");
  await expect(
    page.getByRole("heading", { name: "Seu carrinho está vazio" }),
  ).toBeVisible();
});
test("pagamento recusado preserva carrinho", async ({ page }) => {
  await control(page, "scenario", { scenario: "payment-refused" });
  await checkout(page);
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pagamento recusado" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Voltar ao carrinho" }).click();
  await expect(page.locator(".cart-row")).toHaveCount(1);
});
test("timeout recupera o mesmo pedido sem duplicar a compra", async ({
  page,
}) => {
  await checkout(page);
  await control(page, "scenario", { scenario: "order-timeout" });
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Recuperar pedido" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toBeVisible();
  await expect(page.locator(".receipt")).toContainText("KURIO-1");
  const count = await page.evaluate(async () => {
    const token = localStorage.getItem("kurio.token");
    return (
      await (
        await fetch("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).json()
    ).length;
  });
  expect(count).toBe(1);
});
test("Socket.IO atualiza cotação e ignora eventos duplicados e antigos", async ({
  page,
}) => {
  await checkout(page);
  await control(page, "event", {
    type: "price",
    id: "1",
    duplicate: true,
    stale: true,
  });
  await expect(page.locator(".toast")).toContainText(
    "Revise seu carrinho antes de comprar",
  );
  await expect(page.getByRole("dialog")).toContainText(
    "Preço ou disponibilidade alterado",
  );
  await expect(
    page.getByRole("button", { name: "Confirmar compra", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page
    .getByRole("button", { name: "Revisar compra", exact: true })
    .click();
  await expect(page.getByRole("dialog").locator(".grand-total")).toContainText(
    "2.206 ETH",
  );
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toBeVisible();
});
test("pedido pendente recupera após desconexão e refresh", async ({ page }) => {
  await checkout(page);
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pedido em processamento" }),
  ).toBeVisible();
  await control(page, "event", { type: "disconnect" });
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toBeVisible();
  await expect(page.locator(".receipt")).toContainText("KURIO-1");
});
test("sessão expirada preserva contexto e isola usuários", async ({ page }) => {
  await add(page);
  await login(page, "nova@kurio.test", "Kurio123!", "/pagamento");
  await control(page, "event", { type: "expire" });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /sessão expirou|Entre para continuar/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Entrar", exact: true }).click();
  await page
    .getByRole("textbox", { name: "E-mail", exact: true })
    .fill("nova@kurio.test");
  await page.getByLabel("Senha", { exact: true }).fill("Kurio123!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/pagamento/);
  await expect(
    page.getByRole("heading", { name: "Carteira selecionada" }),
  ).toBeVisible();
  await page.goto("/perfil");
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await login(page, "breno@kurio.test", "Kurio123!", "/carrinho");
  await expect(
    page.getByRole("heading", { name: "Seu carrinho está vazio" }),
  ).toBeVisible();
});
test("favorito otimista faz rollback e recupera", async ({ page }, info) => {
  await login(page);
  await page.goto("/nft/1");
  await control(page, "scenario", { scenario: "favorite-error" });
  const fav =
    info.project.name === "mobile"
      ? page.locator(".mobile-product-actions button")
      : page.locator(".favorite-button");
  await fav.click();
  await expect(page.getByRole("alert")).toContainText(
    "Não foi possível atualizar",
  );
  await expect(fav).toHaveAttribute("aria-pressed", "false");
  await control(page, "scenario", { scenario: "default" });
  await fav.click();
  await expect(fav).toHaveAttribute("aria-pressed", "true");
  await expect(fav).toBeEnabled();
  await page.reload();
  const selected =
    info.project.name === "mobile"
      ? page.locator(".mobile-product-actions button")
      : page.locator(".favorite-button");
  await expect(selected).toHaveAttribute("aria-pressed", "true");
});
test("cadastro valida campos e conflito", async ({ page }) => {
  await page.goto("/cadastro");
  await page.getByRole("button", { name: "Criar perfil", exact: true }).click();
  await expect(page.getByText("Use de 3 a 30")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Nome de usuário", exact: true })
    .fill("nova");
  await page
    .getByRole("textbox", { name: "E-mail", exact: true })
    .fill("nova@kurio.test");
  await page.getByLabel("Senha", { exact: true }).fill("Kurio123!");
  await page.getByLabel("Confirmar senha", { exact: true }).fill("Kurio123!");
  await page.getByRole("button", { name: "Criar perfil", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("já cadastrado");
  await page
    .getByRole("textbox", { name: "Nome de usuário", exact: true })
    .fill("collector");
  await page
    .getByRole("textbox", { name: "E-mail", exact: true })
    .fill("collector@kurio.test");
  await page.getByRole("button", { name: "Criar perfil", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Perfil do colecionador" }),
  ).toBeVisible();
});
test("perfil e carteira persistem e validam dados", async ({ page }) => {
  test.slow();
  await login(page);
  await page
    .getByRole("textbox", { name: "Nome de exibição", exact: false })
    .fill("Nova Atualizada");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Nome de exibição", exact: false }),
  ).toHaveValue("Nova Atualizada");
  await page.locator("#avatar").setInputFiles("public/assets/8f387-320.webp");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("img", { name: "Seu avatar" })).toBeVisible();
  await page.getByLabel("Senha atual", { exact: true }).fill("incorreta");
  await page.getByLabel("Nova senha", { exact: true }).fill("NovaSenha123!");
  await page
    .getByLabel("Confirmar nova senha", { exact: true })
    .fill("NovaSenha123!");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Senha atual incorreta.")).toBeVisible();
  await page.getByLabel("Senha atual", { exact: true }).fill("Kurio123!");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await login(page, "nova@kurio.test", "NovaSenha123!");
  await page.goto("/carteiras");
  await page.getByRole("button", { name: "Adicionar carteira" }).click();
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Apelido da carteira" })
    .fill("Teste");
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Endereço da carteira" })
    .fill("inválido");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Salvar carteira" })
    .click();
  await expect(page.getByText("Endereço incompatível")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Endereço da carteira" })
    .fill("teste.eth");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Salvar carteira" })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Teste", exact: true }),
  ).toBeVisible();
});
test("skeleton, erro de rede e recuperação", async ({ page }) => {
  await control(page, "scenario", { scenario: "slow" });
  await page.goto("/nft/2");
  await expect(page.locator(".detail-loading")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Sage Nomad #009", exact: true }),
  ).toBeVisible();
  await control(page, "scenario", { scenario: "server-error" });
  await page.goto("/nft/3");
  await expect(page.getByRole("alert")).toContainText(
    "temporariamente indisponível",
  );
  await control(page, "scenario", { scenario: "default" });
  await page.getByRole("button", { name: "Tentar novamente" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Neon Vessel #552", exact: true }),
  ).toBeVisible();
});
test("teclado, foco do diálogo e retorno ao acionador", async ({ page }) => {
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Pular para o conteúdo" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Buscar NFTs", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("textbox", { name: "Nome do NFT" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Buscar NFTs", exact: true }),
  ).toBeFocused();
});

test("respostas fora de ordem não substituem a busca atual", async ({
  page,
}) => {
  await control(page, "scenario", { scenario: "out-of-order" });
  await page.goto("/?q=E");
  await expect(page.getByRole("heading", { name: /SEJA DONO/ })).toBeVisible();
  await page.getByRole("button", { name: "Buscar NFTs", exact: true }).click();
  await page.getByRole("textbox", { name: "Nome do NFT" }).fill("Sage");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Buscar", exact: true })
    .click();
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(4);
  await expect(page.locator(".nft-grid")).not.toContainText("Emerald");
  await expect(page).toHaveURL(/q=Sage/);
});
test("edição esgotada impede finalizar a cotação anterior", async ({
  page,
}) => {
  await checkout(page);
  await control(page, "event", { type: "sold-out", id: "1" });
  await expect(
    page.getByRole("button", { name: "Confirmar compra", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Revisar compra", exact: true }),
  ).toBeDisabled();
  await page.goto("/carrinho");
  await expect(page.getByRole("alert")).toContainText("apenas 0");
});
test("cliques repetidos criam somente um pedido", async ({ page }) => {
  await checkout(page);
  const button = page.getByRole("button", {
    name: "Confirmar compra",
    exact: true,
  });
  await button.evaluate((element) => {
    (element as HTMLButtonElement).click();
    (element as HTMLButtonElement).click();
  });
  await expect(
    page.getByRole("heading", {
      name: "Seus NFTs agora estão na sua carteira",
    }),
  ).toBeVisible();
  const orders = await page.evaluate(async () => {
    const token = localStorage.getItem("kurio.token");
    return (
      await (
        await fetch("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).json()
    ).length;
  });
  expect(orders).toBe(1);
});
