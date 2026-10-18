# Playwright — preparação para deploy

A suíte atual de produção tem **66 testes**, em Chromium desktop (1440 × 1000) e mobile (390 × 844). Inclui os casos de normalização de URL e as regressões de autenticação: conflito de e-mail, persistência do endereço normalizado, login após cadastro/edição e erros associados aos campos. As baselines não foram atualizadas nesta execução.

[Relatório HTML da suíte](../reports/playwright/index.html).

Tipos, lint e build passaram na área de trabalho atual. A validação anterior de 52 testes também foi executada em cópia isolada instalada com `npm ci`; a comparação de arquivos e HTML registrada naquela etapa se refere ao build anterior às correções de URL e autenticação. Os testes mantêm MSW e Socket.IO ativos, usam contextos isolados e controlam relógio/cenários. Traces e screenshots de falhas são gerados em `test-results/` quando necessário.

Reprodução:

```sh
npm ci
npx playwright install chromium
npm run typecheck
npm run lint
npm run build
PLAYWRIGHT_PRODUCTION=1 npm test
npm run test:export
```

Para executar sem conflitar com outro preview, use `PLAYWRIGHT_PORT=4183 PLAYWRIGHT_PRODUCTION=1 npm test`. Para abrir o relatório versionado, execute `npx playwright show-report reports/playwright`.

## Verificação posterior dos efeitos de interação

Na etapa de autenticação, a suíte completa tinha 60 testes e foi executada antes dos novos efeitos. Após o ajuste, 12 casos relevantes passaram novamente, preservando as baselines. [Relatório dos efeitos](../reports/playwright-motion/index.html).

```sh
PLAYWRIGHT_PRODUCTION=1 PLAYWRIGHT_HTML_OUTPUT_DIR=reports/playwright-motion npx playwright test --grep 'regressão visual|assets visíveis|teclado, foco|favorito otimista|URL omite|compra completa'
```

As verificações adicionais de hover, movimento reduzido, fallback sem View Transition API e toque estão descritas em VALIDATION.md.

## Navegação e robustez do carrinho

A suíte completa atual inclui seis verificações adicionais (três casos em cada perfil): menus sem reload com filtros preservados e movimento reduzido; paginação em 1024 × 600 com consulta lenta, cards estáveis e histórico; resposta de carrinho sem items com erro recuperável. O relatório principal corresponde à execução completa de 66 testes após esses ajustes.
