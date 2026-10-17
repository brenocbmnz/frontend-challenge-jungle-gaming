# Validação da preparação para deploy

## Execução reproduzível

Uma cópia isolada, sem `node_modules` nem build anterior, foi instalada com `npm ci`. Tipos, ESLint e build passaram. Os arquivos de código, testes e configuração foram comparados com a área de trabalho; o HTML do build final é idêntico nas duas cópias.

A suíte final de produção contém **52 testes** em Chromium, nos viewports desktop de 1440 × 1000 e mobile de 390 × 844. Inclui os fluxos anteriores e os novos casos de cupom expirado/remoção, recusa e desconexão de carteira, seleção de rede, dados adicionais do colecionador, validação da API, edição das carteiras, conflito de idempotência e foco do atalho de conteúdo.

As telas privadas também foram verificadas em 390, 768 e 1440 px, além de 720 e 320 CSS px, correspondentes ao reflow de 200% em 1440 px e 400% em 1280 px. Essas verificações não substituem uma auditoria manual de todas as combinações de navegador e zoom.

- [Relatório HTML Playwright](../reports/playwright/index.html)
- [Reprodução dos testes e relatórios](TEST_REPORTS.md)
- [Galeria de revisão visual](../reports/design-review/index.html)

Oito baselines de início, detalhe, carrinho e pagamento acompanham `tests/visual.spec.ts-snapshots/`. Traces e screenshots de falhas são configurados em `test-results/`; o relatório entregue registra a execução aprovada. Assets originais e fonte permanecem locais.

## Lighthouse do build final

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
