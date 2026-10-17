# Lighthouse

Execução: 2026-10-17T21:58:41.941Z. Node v22.17.1; Lighthouse 12.8.2.

Medianas de três execuções por página e perfil. LCP/TBT em ms.

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| inicio | desktop | 100 | 100 | 100 | 100 | 761 | 0.000 | 0 |
| detalhe | desktop | 100 | 100 | 100 | 100 | 729 | 0.000 | 0 |
| inicio | mobile | 92 | 100 | 100 | 100 | 3251 | 0.000 | 52 |
| detalhe | mobile | 93 | 100 | 100 | 100 | 3135 | 0.000 | 10 |

Ambiente e resultados completos: [summary.json](summary.json). Os relatórios individuais HTML/JSON acompanham esta pasta.

A simulação carrega MSW e o banco local antes da aplicação. Os PNGs originais são preservados e a interface usa derivações WebP responsivas. O preview serve Brotli/gzip para os mesmos arquivos estáticos da entrega. Metas abaixo do solicitado exigem atenção ao custo inicial dos mocks e ao trabalho de CPU; consulte os diagnósticos em cada HTML.
