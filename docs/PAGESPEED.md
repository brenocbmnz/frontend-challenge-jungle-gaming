# Correções do PageSpeed Insights

Trabalho na branch `perf/pagespeed-insights`. Cada apontamento recebe uma correção e validação próprias. A branch fica separada da `main` até concluir todos os pontos.

Referência: [relatório mobile enviado em 18/10/2026](https://pagespeed.web.dev/analysis/https-frontend-challenge-jungle-gaming-rosy-vercel-app/ct8cjzzlmb?form_factor=mobile).

## 1. LCP request discovery

A imagem identificada foi Neon Vessel #552, no terceiro card do catálogo inicial. Seu preload recebia prioridade baixa, enquanto o elemento img não tinha fetchpriority. Mantive o carregamento eager existente e apliquei prioridade alta no preload desse candidato e na imagem do terceiro card. O primeiro preload, usado pela arte do banner, continua com prioridade alta; não promovi todas as imagens do catálogo.

A orientação do [Chrome](https://developer.chrome.com/docs/performance/insights/lcp-discovery) recomenda prioridade alta no preload e na imagem candidata ao LCP.

Build com TypeScript, lint e diff check passaram. A inspeção de rede em 390 e 1440 px confirmou prioridade inicial High para a arte Neon. Uma execução local mobile do Lighthouse aprovou o item com score 1 e os três critérios verdadeiros: priorityHinted, requestDiscoverable e eagerlyLoaded.

[Relatório HTML](../reports/pagespeed-lcp-discovery/mobile.html), [JSON completo](../reports/pagespeed-lcp-discovery/mobile.json), [checagens de rede](../reports/pagespeed-lcp-discovery/network-checks.json) e [resumo](../reports/pagespeed-lcp-discovery/summary.json).

Essa execução local isolada marcou 90 em performance e LCP de 3,4 s. Não é uma nova medição do PageSpeed publicado nem uma comparação antes/depois; valida somente o apontamento tratado. Os outros itens e a suíte completa não foram reavaliados nesta etapa. Não alterei baselines visuais nem integrei a branch à main.


## 2. Network dependency tree

O HTML descobria a entrada primeiro; só após executá-la o navegador descobria os módulos de bootstrap e suas dependências. Adicionei um plugin de build que gera modulepreload para os módulos iniciais de app e mocks e suas dependências estáticas. Os nomes são extraídos do bundle do Vite, sem hashes fixos. Os links entram no início do head, antes do script de entrada. Não percorro imports dinâmicos das páginas ou diálogos; eles continuam sob demanda. A espera pelo worker do MSW antes da montagem continua intacta.

A orientação do [Chrome](https://developer.chrome.com/docs/performance/insights/network-dependency-tree) recomenda antecipar a descoberta dos recursos críticos para encurtar as cadeias. Os recursos são da mesma origem; o relatório não indicou candidatos adicionais a preconnect.

Build com TypeScript, lint e check de whitespace do código passaram. Na configuração final, os oito módulos anunciados tiveram uma única requisição cada. Os **18 testes direcionados de produção passaram** em desktop/mobile, cobrindo catálogo, detalhe direto, compra, sessão, Socket.IO, respostas fora de ordem, recuperação de falha, regressão visual e assets/overflow: [relatório](../reports/playwright-network-dependencies/index.html). Não atualizei baselines nem repeti a suíte completa.

Na validação final com **Lighthouse 13.5.0**, a mesma versão do relatório enviado, **Network dependency tree e LCP request discovery passaram, ambos com score 1**. A árvore crítica exibida contém somente o documento, com 73 ms nesta amostra. Os arquivos da aplicação continuam sendo carregados; agora são descobertos pelo preload no HTML. A execução usou Node 22.22.0 como ferramenta isolada, sem modificar package.json ou lockfile.

O resultado geral desta amostra local foi performance 80 e LCP de 3,7 s. Não representa uma nova medição no PageSpeed publicado nem prova de ganho na nota geral. A auditoria anterior do item 1 e a execução intermediária usaram Lighthouse 12.8.2; a comparação de árvores está preservada e identificada como intermediária. Nesta última, os hints ainda estavam no fim do head e a entrada continuava na cadeia. Não comparo diretamente os tempos entre versões como benchmark.

[Auditoria final HTML](../reports/pagespeed-network-dependencies/mobile-lh13.report.html), [JSON final](../reports/pagespeed-network-dependencies/mobile-lh13.report.json), [resumo final](../reports/pagespeed-network-dependencies/summary.json), [comparação intermediária](../reports/pagespeed-network-dependencies/comparison.json) e [checagem de preloads](../reports/pagespeed-network-dependencies/preload-checks.json). A branch permanece sem merge na main.
