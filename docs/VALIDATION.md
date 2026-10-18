# Validação da preparação para deploy

## Execução reproduzível

Na etapa anterior de preparação, uma cópia isolada, sem `node_modules` nem build anterior, foi instalada com `npm ci`. Tipos, ESLint e build passaram. Os arquivos de código, testes e configuração foram comparados com a área de trabalho; o HTML do build final é idêntico nas duas cópias.

A suíte daquela etapa de produção continha **52 testes** em Chromium, nos viewports desktop de 1440 × 1000 e mobile de 390 × 844. Inclui os fluxos anteriores e os novos casos de cupom expirado/remoção, recusa e desconexão de carteira, seleção de rede, dados adicionais do colecionador, validação da API, edição das carteiras, conflito de idempotência e foco do atalho de conteúdo.

As telas privadas também foram verificadas em 390, 768 e 1440 px, além de 720 e 320 CSS px, correspondentes ao reflow de 200% em 1440 px e 400% em 1280 px. Essas verificações não substituem uma auditoria manual de todas as combinações de navegador e zoom.

- [Relatório HTML Playwright](../reports/playwright/index.html)
- [Reprodução dos testes e relatórios](TEST_REPORTS.md)
- [Galeria de revisão visual](../reports/design-review/index.html)

Oito baselines de início, detalhe, carrinho e pagamento acompanham `tests/visual.spec.ts-snapshots/`. Traces e screenshots de falhas são configurados em `test-results/`; o relatório entregue registra a execução aprovada. Assets originais e fonte permanecem locais.

## Lighthouse do build anterior aos ajustes de URL e autenticação

Medianas de três execuções por página e perfil, com os mocks padrão e todas as funcionalidades ativos:

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO |
| --- | --- | --- | --- | --- | --- |
| Início | Desktop | 100 | 100 | 100 | 100 |
| Detalhe | Desktop | 100 | 100 | 100 | 100 |
| Início | Mobile | 92 | 100 | 100 | 100 |
| Detalhe | Mobile | 93 | 100 | 100 | 100 |

As quatro combinações atendem às metas do desafio. LCP, CLS, TBT, resultados individuais, versões e condições do ambiente estão em [reports/lighthouse](../reports/lighthouse/README.md), com relatórios HTML e JSON.

A entrada JavaScript pequena carrega interface e mocks em paralelo e só monta o React após registrar o worker. Os recursos visíveis são antecipados com prioridade adequada. O cenário padrão, imagens, fontes, REST e Socket.IO permanecem ativos na auditoria. Os avisos sobre o futuro carregador nativo de configuração do Vite não impedem a execução.

## Documentação e limites

- [Conferência dos requisitos](CHALLENGE_REVIEW.md), [contratos REST/eventos](API.md) e [arquitetura](../ARCHITECTURE.md).
- A revisão visual e os desvios conhecidos estão em [DESIGN_REVIEW.md](DESIGN_REVIEW.md). O limite da integração Figma ainda impede certificar fidelidade integral a referências não recuperadas.
- As configurações e instruções de Vercel/Netlify estão em [DEPLOY.md](DEPLOY.md). A publicação foi realizada pelo usuário na Vercel e a URL foi incluída no README.
- Repositório de entrega: https://github.com/brenocbmnz/frontend-challenge-jungle-gaming.

## Ajuste da URL após publicação — 17/10/2026

O catálogo agora omite parâmetros vazios e valores padrão usando o middleware do TanStack Router. Filtros ativos continuam na URL; links antigos com os padrões são normalizados. Build e lint passaram. Seis testes de produção direcionados passaram em desktop/mobile, cobrindo normalização, filtros, ordenação, paginação, refresh e histórico ([relatório](../reports/playwright-url/index.html)). Esta execução complementa os 52 testes anteriores; não substitui a suíte completa nem as medições Lighthouse acima.

No domínio público informado pelo usuário, foram verificados carregamento do catálogo, service workers JavaScript com HTTP 200, acesso direto e refresh de detalhe, login e checkout simulado até o recibo, sem erros de página. Essa conferência ocorreu antes da publicação do ajuste da URL.

## Revisão de autenticação — 18/10/2026

A suíte atual contém **60 testes de produção** em Chromium desktop/mobile. Inclui a normalização de URL e seis verificações adicionais de autenticação (três cenários em cada viewport): validação acessível do login, conflito/cadastro de e-mail e edição de perfil com persistência e novo login. Todos passaram, sem atualizar baselines. Tipos, lint e build também passaram na área de trabalho atual. O [relatório completo](../reports/playwright/index.html) substitui o relatório da suíte anterior; as medições Lighthouse acima continuam referentes ao build anterior.

Cadastro, login e perfil passam a remover espaços externos do e-mail e a normalizar maiúsculas. A comparação de conflitos aplica a mesma regra aos registros existentes. Senhas não são normalizadas. O login retorna erros de preenchimento associados aos campos e mantém a mensagem genérica para credenciais incorretas. A arquitetura permanece com autenticação simulada via API/MSW.

## Efeitos de interação — 18/10/2026

Build (incluindo TypeScript), lint e diff check passaram. Foram executados **12 testes de produção direcionados**, todos aprovados em desktop/mobile: compra completa, favoritos com rollback, URL/refresh, teclado/foco de diálogo, regressão visual e integridade dos assets/overflow. As oito baselines foram preservadas. [Relatório desta etapa](../reports/playwright-motion/index.html).

Verificações adicionais em Chromium confirmaram hover sem mudança na geometria do card, transição de navegação, foco ao abrir/fechar diálogo, ausência de animação com movimento reduzido, navegação sem View Transition API e funcionamento por toque em 390 px. Não houve erros de página nesses cenários. A suíte completa de 60 testes acima se refere à versão anterior de autenticação; nesta etapa foram repetidos os 12 casos pertinentes. Lighthouse não foi repetido.
