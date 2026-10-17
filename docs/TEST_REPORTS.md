# Playwright — preparação para deploy

A suíte de produção tem **52 testes**, em Chromium desktop (1440 × 1000) e mobile (390 × 844). A validação foi realizada em cópia isolada instalada com `npm ci`, usando a porta 4183, sem atualizar as baselines na execução final.

[Relatório HTML da suíte](../reports/playwright/index.html).

Tipos, lint e build passaram na mesma cópia. O HTML do build final foi comparado com o da área de trabalho e é idêntico. Os testes mantêm MSW e Socket.IO ativos, usam contextos isolados e controlam relógio/cenários. Traces e screenshots de falhas são gerados em `test-results/` quando necessário.

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
