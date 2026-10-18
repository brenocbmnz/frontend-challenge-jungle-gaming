# Playwright — preparação para deploy

A suíte atual de produção tem **60 testes**, em Chromium desktop (1440 × 1000) e mobile (390 × 844). Inclui os casos de normalização de URL e as regressões de autenticação: conflito de e-mail, persistência do endereço normalizado, login após cadastro/edição e erros associados aos campos. As baselines não foram atualizadas nesta execução.

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
