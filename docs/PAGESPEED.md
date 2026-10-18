# Correções do PageSpeed Insights

Trabalho na branch `perf/pagespeed-insights`. Cada apontamento recebe uma correção e validação próprias. A branch fica separada da `main` até concluir todos os pontos.

Referência: [relatório mobile enviado em 18/10/2026](https://pagespeed.web.dev/analysis/https-frontend-challenge-jungle-gaming-rosy-vercel-app/ct8cjzzlmb?form_factor=mobile).

## 1. LCP request discovery

A imagem identificada foi Neon Vessel #552, no terceiro card do catálogo inicial. Seu preload recebia prioridade baixa, enquanto o elemento img não tinha fetchpriority. Mantive o carregamento eager existente e apliquei prioridade alta no preload desse candidato e na imagem do terceiro card. O primeiro preload, usado pela arte do banner, continua com prioridade alta; não promovi todas as imagens do catálogo.

A orientação do [Chrome](https://developer.chrome.com/docs/performance/insights/lcp-discovery) recomenda prioridade alta no preload e na imagem candidata ao LCP.

Build com TypeScript, lint e diff check passaram. A inspeção de rede em 390 e 1440 px confirmou prioridade inicial High para a arte Neon. Uma execução local mobile do Lighthouse aprovou o item com score 1 e os três critérios verdadeiros: priorityHinted, requestDiscoverable e eagerlyLoaded.

[Relatório HTML](../reports/pagespeed-lcp-discovery/mobile.html), [JSON completo](../reports/pagespeed-lcp-discovery/mobile.json), [checagens de rede](../reports/pagespeed-lcp-discovery/network-checks.json) e [resumo](../reports/pagespeed-lcp-discovery/summary.json).

Essa execução local isolada marcou 90 em performance e LCP de 3,4 s. Não é uma nova medição do PageSpeed publicado nem uma comparação antes/depois; valida somente o apontamento tratado. Os outros itens e a suíte completa não foram reavaliados nesta etapa. Não alterei baselines visuais nem integrei a branch à main.
