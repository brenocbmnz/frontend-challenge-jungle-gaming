# Playwright — preparação para deploy

A última execução completa de produção aprovou **92 testes**, em Chromium desktop (1440 × 1000) e mobile (390 × 844), com dois workers, antes do envio das branches. Nenhuma baseline foi atualizada nessa execução.

[Relatório HTML da última execução completa](../reports/playwright-pre-push/index.html). [Execução histórica da navegação da conta](../reports/playwright-account-navigation/index.html). [Execução histórica de paginação mobile](../reports/playwright-mobile-pagination/index.html). [Execução histórica de filtros, favoritos e raridade](../reports/playwright-catalog-interactions/index.html). [Relatório histórico da migração local para shadcn/ui](../reports/playwright-shadcn/index.html). O [relatório anterior](../reports/playwright/index.html) corresponde à etapa de navegação e carrinho.

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

## Migração local para shadcn/ui

Após importar Button e Dialog pelo CLI oficial e adaptar os estilos, a suíte completa de 66 testes passou novamente, em produção, sem atualizar baselines. O relatório foi gerado separadamente com:

```sh
PLAYWRIGHT_PRODUCTION=1 PLAYWRIGHT_HTML_OUTPUT_DIR=reports/playwright-shadcn npx playwright test
```

Os testes cobrem os componentes em uso real nos fluxos existentes, incluindo navegação por teclado, foco dos diálogos, formulários, compra, carteiras e regressão visual. Esta etapa permanece local, sem commit ou push.

## Correção local do catálogo

A inclusão de `tests/catalog-layout.spec.ts` amplia a suíte para 68 casos. O teste percorre seis larguras e as páginas 1 e 4 do catálogo para verificar nomes/preços visíveis, imagens alinhadas e linhas sem sobreposição. Foram executados 14 casos direcionados em produção, todos aprovados. [Relatório desta etapa](../reports/playwright-catalog-layout/index.html). As duas baselines da página inicial foram atualizadas; as outras seis permanecem iguais. A última execução completa continua sendo a de 66 testes da migração shadcn/ui.

```sh
PLAYWRIGHT_PRODUCTION=1 PLAYWRIGHT_HTML_OUTPUT_DIR=reports/playwright-catalog-layout npx playwright test tests/catalog-layout.spec.ts tests/visual.spec.ts tests/navigation.spec.ts tests/marketplace.spec.ts --grep 'todos os cards|regressão visual|assets visíveis|menus preservam|paginação mantém|resposta de carrinho|compra completa'
```

## Banner e filtros mobile

O teste de layout agora também confere uma única arte visível no banner e o centro do ícone de filtros em telas de até 768 px. Dez casos direcionados passaram em produção, nos dois perfis. [Relatório](../reports/playwright-mobile-banner/index.html). Nesta etapa, somente a baseline de início mobile foi atualizada.

```sh
PLAYWRIGHT_PRODUCTION=1 PLAYWRIGHT_HTML_OUTPUT_DIR=reports/playwright-mobile-banner npx playwright test tests/catalog-layout.spec.ts tests/visual.spec.ts tests/marketplace.spec.ts --grep 'todos os cards|regressão visual|assets visíveis|teclado, foco|catálogo compõe'
```


## Filtros, favoritos e raridade — 18/10/2026

Os **76 testes completos de produção passaram**, nos dois perfis. Os oito novos casos verificam filtros sem checkmark visual, favoritos por hover/teclado no desktop e ocultos nos cards mobile, raridade estável após busca/ordenação e atualização dos dados antigos sem apagar o carrinho. As duas baselines de início foram atualizadas; as outras seis foram preservadas.

```sh
PLAYWRIGHT_PRODUCTION=1 PLAYWRIGHT_HTML_OUTPUT_DIR=reports/playwright-catalog-interactions npx playwright test
```


## Recibo e carteira — 18/10/2026

Dezoito casos direcionados distintos passaram em desktop/mobile, incluindo centralização do recibo, eventos próprios/externos de estoque, alinhamento e persistência da carteira e reflow. A execução inicial aprovou 17 casos; o teste desktop da carteira passou após corrigir seu novo seletor de combobox. [Execução inicial](../reports/playwright-receipt-wallet/index.html) e [reexecução da carteira](../reports/playwright-wallet-alignment/index.html). Nenhuma baseline foi atualizada; a suíte completa não foi repetida nesta etapa.


## Paginação e controles mobile — 18/10/2026

Os **82 testes completos de produção passaram**, com dois workers e os perfis desktop/mobile. Os seis casos adicionais verificam páginas de 6 itens no mobile e 9 no desktop, estado da URL, refresh/histórico, posição da tela durante consulta lenta, última página e ajuste da seleção ao mudar de viewport, ausência de carregamento por rolagem, dimensões da barra de compra, estado desabilitado do controle de menos e recorte do menu inferior. Os testes de layout continuam cobrindo de 320 a 1440 px. [Relatório completo](../reports/playwright-mobile-pagination/index.html). Os [10 testes direcionados](../reports/playwright-mobile-pagination-targeted/index.html) também passaram.

```sh
PLAYWRIGHT_PRODUCTION=1 PLAYWRIGHT_HTML_OUTPUT_DIR=reports/playwright-mobile-pagination npx playwright test --workers=2
```

As baselines de início e detalhe mobile foram atualizadas; as outras seis foram preservadas nesta etapa. O catálogo final tem paginação manual, sem carregamento automático ao rolar.


## Banner mobile e ícone de filtros — 18/10/2026

Os **12 testes direcionados de produção passaram** em desktop/mobile, incluindo o banner em sete larguras (320 a 1440 px, com 414 px), abertura dos filtros, teclado/foco, regressão visual e assets/overflow. O teste de layout agora verifica a sobreposição da miniatura na arte principal, o link Explorar dentro do banner e os indicadores centralizados. [Relatório desta etapa](../reports/playwright-banner-refinement/index.html). Somente a baseline de início mobile foi atualizada; as outras sete foram preservadas. A suíte completa de 82 casos não foi repetida nesta etapa.


## Menu da conta, avatar e seta de paginação — 18/10/2026

Os **88 testes completos de produção passaram**, em desktop/mobile, com dois workers. Os seis casos novos verificam seta ausente em resultado de uma página, painel mobile com links verticais de pelo menos 44 px, seção atual, teclado/Escape/retorno do foco, fechamento ao navegar e logout, avatar circular com borda laranja, upload, sincronização do cabeçalho, refresh, remoção e troca de usuário. Os 16 testes direcionados anteriores também passaram. [Relatório completo](../reports/playwright-account-navigation/index.html) e [relatório direcionado](../reports/playwright-account-navigation-targeted/index.html).

```sh
PLAYWRIGHT_PRODUCTION=1 PLAYWRIGHT_HTML_OUTPUT_DIR=reports/playwright-account-navigation npx playwright test --workers=2
```

Foram atualizadas as baselines de pagamento desktop e carrinho mobile para as mudanças no avatar/cabeçalho. As outras seis foram preservadas em relação à etapa anterior.


## Layout da conta, menus sobrepostos e ações móveis — 18/10/2026

Restaurei a barra lateral e o editor de avatar originais do desktop, mantendo o cabeçalho com avatar e “Perfil”. No mobile, o cabeçalho tem somente busca, carrinho e menu. Os dois menus abrem sobre o conteúdo sem deslocar o formulário e fecham ao clicar fora, navegar ou pressionar Escape.

O botão central rola suavemente até o catálogo, inclusive ao repetir o destino atual, preservando os filtros. A preferência por movimento reduzido usa rolagem instantânea. O botão Salvar acompanha a viewport mobile, com entrada de 160 ms, espaço reservado no formulário e feedback dentro da barra; no desktop permanece no fluxo original.

Os **20 testes direcionados de produção passaram**, nos dois perfis e com dois workers: [relatório](../reports/playwright-floating-profile-actions/index.html). Os testes novos de navegação e ação fixa ampliam a suíte de 88 para 92 casos. Build (incluindo TypeScript), lint e diff check passaram. Somente a baseline de pagamento desktop mudou nesta etapa; as outras sete foram preservadas. A última execução completa continua sendo a de 88 casos. Lighthouse não foi repetido. Tudo permanece local, sem commit, push ou deploy.

```sh
PLAYWRIGHT_PRODUCTION=1 PLAYWRIGHT_HTML_OUTPUT_DIR=reports/playwright-floating-profile-actions npx playwright test tests/account-navigation.spec.ts tests/auth.spec.ts tests/marketplace.spec.ts tests/completion.spec.ts tests/visual.spec.ts --grep 'paginação de resultado|menu mobile da conta|desktop preserva|botão central usa|Salvar acompanha|perfil e carteira|telas privadas refluem|perfil bloqueia|regressão visual|assets visíveis' --workers=2
```


## Salvar por alteração e título do perfil — 18/10/2026

Os **10 testes da navegação da conta passaram** em produção desktop/mobile: [relatório](../reports/playwright-profile-dirty/index.html). Cobrem o botão ausente antes de editar, visível ao alterar, oculto ao reverter e após salvar, além do título Perfil com link de retorno. Build, lint e diff check passaram. Nenhuma baseline atualizada; suíte completa não repetida.


## Integração das branches — 18/10/2026

Os **92 testes completos de produção passaram**, em desktop/mobile e com dois workers, sem atualizar baselines: [relatório](../reports/playwright-pre-push/index.html). O build final foi gerado antes dessa execução. Também executei o build de cada uma das três etapas de código em uma worktree separada; todas passaram. O lint da integração final passou e os 292 arquivos dos builds local e integrado são idênticos em SHA-256. A separação das branches é retrospectiva e está documentada em [VERSIONING.md](VERSIONING.md). Lighthouse não foi repetido.

```sh
PLAYWRIGHT_PRODUCTION=1 PLAYWRIGHT_HTML_OUTPUT_DIR=reports/playwright-pre-push npx playwright test --workers=2
```
