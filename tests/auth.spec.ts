import { test, expect } from "@playwright/test";
import { start, login, logout } from "./helpers";

test.beforeEach(async ({ page }) => {
  await start(page);
});

test("login associa erros aos campos e normaliza o e-mail sem alterar a senha", async ({
  page,
}) => {
  await page.goto("/login?redirect=/carteiras");
  const email = page.getByRole("textbox", { name: "E-mail", exact: true });
  const password = page.getByLabel("Senha", { exact: true });
  const submit = page.getByRole("button", { name: "Entrar", exact: true });
  await submit.click();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAccessibleDescription("Informe seu e-mail.");
  await expect(password).toHaveAccessibleDescription("Informe sua senha.");
  await email.fill("incorreto");
  await password.fill("Kurio123!");
  await submit.click();
  await expect(email).toHaveAccessibleDescription("Informe um e-mail válido.");
  await email.fill("  NOVA@KURIO.TEST  ");
  await password.fill(" Kurio123! ");
  await submit.click();
  await expect(page.getByRole("alert")).toContainText(
    "E-mail ou senha incorretos.",
  );
  await expect(email).toHaveAttribute("aria-invalid", "false");
  await expect(password).toHaveAttribute("aria-invalid", "false");
  await password.fill("Kurio123!");
  await submit.click();
  await expect(page).toHaveURL(/\/carteiras$/);
  await expect(
    page.getByRole("heading", { name: "Carteira principal" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Carteira principal" }),
  ).toBeVisible();
});

test("cadastro rejeita e-mail equivalente e persiste o endereço normalizado", async ({
  page,
}) => {
  await page.goto("/cadastro");
  await page.getByLabel("Nome de usuário", { exact: true }).fill("casecheck");
  const email = page.getByLabel("E-mail", { exact: true });
  await email.fill(" NOVA@kurio.test ");
  await page.getByLabel("Senha", { exact: true }).fill("Other123!");
  await page.getByLabel("Confirmar senha", { exact: true }).fill("Other123!");
  const submit = page.getByRole("button", {
    name: "Criar perfil",
    exact: true,
  });
  await submit.click();
  await expect(page.getByRole("alert")).toContainText("já cadastrado");
  await expect(email).toHaveAccessibleDescription(
    "Já existe uma conta com estes dados.",
  );
  await email.fill(" NewCollector@KURIO.TEST ");
  await submit.click();
  await expect(page).toHaveURL(/\/perfil$/);
  await expect(page.getByLabel("E-mail", { exact: true })).toHaveValue(
    "newcollector@kurio.test",
  );
  await page.reload();
  await expect(page.getByLabel("E-mail", { exact: true })).toHaveValue(
    "newcollector@kurio.test",
  );
  await logout(page);
  await login(page, " NEWCOLLECTOR@kurio.test ", "Other123!");
  await expect(page.getByLabel("Nome de usuário", { exact: true })).toHaveValue(
    "casecheck",
  );
});

test("perfil bloqueia e-mail de outro usuário e mantém login após normalização", async ({
  page,
}) => {
  await login(page);
  const email = page.getByLabel("E-mail", { exact: true });
  const save = page.getByRole("button", { name: "Salvar", exact: true });
  await email.fill(" BRENO@KURIO.TEST ");
  await save.click();
  await expect(email).toHaveAccessibleDescription(
    "E-mail ou usuário já cadastrado.",
  );
  await page.reload();
  await expect(email).toHaveValue("nova@kurio.test");
  await email.fill(" NOVA@KURIO.TEST ");
  await save.click();
  await expect(
    page.getByText("Perfil salvo com sucesso.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(email).toHaveValue("nova@kurio.test");
  await email.fill(" Changed@KURIO.TEST ");
  await save.click();
  await expect(
    page.getByText("Perfil salvo com sucesso.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(email).toHaveValue("changed@kurio.test");
  await logout(page);
  await login(page, " CHANGED@kurio.test ");
  await expect(page.getByLabel("Nome de usuário", { exact: true })).toHaveValue(
    "nova",
  );
});
