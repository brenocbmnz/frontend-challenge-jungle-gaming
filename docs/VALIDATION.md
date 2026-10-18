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

Na etapa de autenticação, a suíte continha **60 testes de produção** em Chromium desktop/mobile. Inclui a normalização de URL e seis verificações adicionais de autenticação (três cenários em cada viewport): validação acessível do login, conflito/cadastro de e-mail e edição de perfil com persistência e novo login. Todos passaram, sem atualizar baselines. Tipos, lint e build também passaram na área de trabalho atual. O [relatório completo](../reports/playwright/index.html) substitui o relatório da suíte anterior; as medições Lighthouse acima continuam referentes ao build anterior.

Cadastro, login e perfil passam a remover espaços externos do e-mail e a normalizar maiúsculas. A comparação de conflitos aplica a mesma regra aos registros existentes. Senhas não são normalizadas. O login retorna erros de preenchimento associados aos campos e mantém a mensagem genérica para credenciais incorretas. A arquitetura permanece com autenticação simulada via API/MSW.

## Efeitos de interação — 18/10/2026

Build (incluindo TypeScript), lint e diff check passaram. Foram executados **12 testes de produção direcionados**, todos aprovados em desktop/mobile: compra completa, favoritos com rollback, URL/refresh, teclado/foco de diálogo, regressão visual e integridade dos assets/overflow. As oito baselines foram preservadas. [Relatório desta etapa](../reports/playwright-motion/index.html).

Verificações adicionais em Chromium confirmaram hover sem mudança na geometria do card, transição de navegação, foco ao abrir/fechar diálogo, ausência de animação com movimento reduzido, navegação sem View Transition API e funcionamento por toque em 390 px. Não houve erros de página nesses cenários. A suíte completa de 60 testes acima se refere à versão anterior de autenticação; nesta etapa foram repetidos os 12 casos pertinentes. Lighthouse não foi repetido.

## Navegação, paginação e carrinho — 18/10/2026

A suíte completa atual contém **66 testes de produção** em desktop/mobile. Foram acrescentados seis casos para menus sem reload, preservação dos filtros, rolagem suave/movimento reduzido, paginação com rede lenta em 1024 × 600 e resposta de carrinho sem items com recuperação. As oito baselines continuam preservadas. O [relatório principal](../reports/playwright/index.html) corresponde a esta etapa e substitui o relatório anterior.

Build (incluindo TypeScript), lint e diff check passaram. As larguras 390, 768, 1024, 1366 e 1440 px foram verificadas sem overflow e sem zoom aplicado pela aplicação. Em 768 px, os cards passaram de 352 para 229 px; o desktop e o celular mantêm as dimensões anteriores. A fonte base continua em 14 px.

Uma verificação adicional em Firefox 150.0.2, com cliente Playwright 1.60.0 compatível com o navegador já instalado, aprovou menus sem recarregar o documento, posição da paginação e recuperação do carrinho malformado por navegação normal. O reload forçado pelo protocolo de automação apresentou recarregamentos do service worker; essa modalidade específica não foi certificada no Firefox. Os testes de refresh da suíte principal foram executados no Chromium. A causa original do erro intermitente relatado pelo usuário permanece não confirmada; a validação da resposta e a proteção do contador impedem a falha de renderização para o formato reproduzido.

As medições Lighthouse anteriores não foram repetidas nesta etapa.

## Migração local para shadcn/ui — 18/10/2026

Button e Dialog foram importados pelo CLI oficial `shadcn@4.22.0`, e depois personalizados para manter os estilos do Figma. As cópias originais, hashes e adaptações estão documentados em [SHADCN.md](SHADCN.md). As páginas usam o Button importado; o adaptador de diálogos da aplicação compõe os componentes oficiais e preserva carregamento sob demanda e retorno do foco.

TypeScript, ESLint, build e diff check passaram. Os **66 testes completos de produção passaram** em Chromium desktop/mobile, sem atualizar as oito baselines visuais. O [relatório desta migração](../reports/playwright-shadcn/index.html) é separado do relatório anterior. Uma verificação adicional conferiu os atributos dos componentes renderizados, Button com asChild em um link, título/descrição do Dialog, Escape e retorno do foco. A prévia de desenvolvimento em localhost:5173 também foi verificada sem erros de página.

As dependências e o lockfile permanecem iguais aos anteriores: os imports usam os pacotes individuais Radix e o utilitário cn já existentes. Lighthouse não foi repetido nesta etapa; os resultados anteriores não constituem uma nova medição do build local. As alterações desta migração não foram commitadas, enviadas ao GitHub ou publicadas na Vercel.

## Correção dos cards do catálogo — 18/10/2026

Removi a regra que ocultava o título e o preço do oitavo card no desktop. No mobile/tablet, removi o deslocamento vertical dos cards pares: eram 32 px de deslocamento para apenas 24 px de intervalo entre as linhas, causando sobreposição. Os links dos cards do catálogo agora ocupam um bloco completo, incluindo imagem, nome e preço.

O novo teste `tests/catalog-layout.spec.ts` verifica todos os nove cards nas páginas 1 e 4, em 320, 390, 683, 768, 1024 e 1440 px, nos dois perfis: visibilidade do nome/preço, ausência de corte horizontal e sobreposição e alinhamento das imagens de cada linha. A suíte passa a ter 68 casos; nesta etapa foram executados **14 testes direcionados**, todos aprovados, incluindo esse teste, compra, navegação, paginação, recuperação do carrinho, regressão visual e assets/overflow. [Relatório desta correção](../reports/playwright-catalog-layout/index.html).

As referências da página inicial desktop/mobile foram atualizadas para mostrar os preços completos e a grade alinhada. As outras seis referências permanecem iguais. Build (incluindo tipos), lint e diff check passaram. A última suíte completa de 66 testes corresponde à migração shadcn/ui acima; a suíte completa de 68 casos não foi executada nesta etapa. Tudo permanece local, sem commit, push ou deploy.

## Banner e botão de filtros mobile — 18/10/2026

Removi a miniatura decorativa que ficava sobreposta à arte principal do banner. O botão de filtros passou a ser um botão de ícone com nome acessível “Filtros”: o texto visualmente oculto anterior ainda criava uma segunda célula no grid. Agora o SVG é o único conteúdo visível e o intervalo do grid é zero.

A verificação de layout foi ampliada para conferir uma única arte no banner e a centralização do ícone nas larguras mobile/tablet. Em 683 px, o botão mede 45 × 45 px e o SVG 22 × 22 px, com deslocamento de centro zero nos dois eixos. Os **10 testes direcionados de produção passaram** em desktop/mobile: layout, filtros combinados, teclado/foco, regressão visual e assets/overflow. [Relatório](../reports/playwright-mobile-banner/index.html). Apenas a baseline da página inicial mobile foi atualizada nesta correção; as outras sete foram preservadas.

Build (incluindo tipos), lint e diff check passaram. A suíte completa de 68 casos não foi repetida. As alterações continuam locais, sem commit, push ou deploy.


## Filtros, favoritos e raridade — 18/10/2026

Os filtros selecionados mantêm a cor dourada e a semântica de checkbox, sem acrescentar o símbolo de check. Os corações dos cards aparecem no desktop por hover sobre a arte, com transição de 120 ms, ou por foco de teclado. Nos cards mobile ficam ocultos; o favorito continua disponível no detalhe. A preferência por movimento reduzido é respeitada.

A raridade passou a ser um campo explícito da API mock, associado ao ID do NFT. A etiqueta aparece em desktop e mobile, independentemente da posição após filtros e ordenação. Os dados persistidos antigos recebem o campo sem apagar o carrinho ou outros dados.

Os **76 testes completos de produção passaram** em Chromium desktop/mobile, incluindo oito novos casos para esses comportamentos e a migração dos dados. [Relatório completo](../reports/playwright-catalog-interactions/index.html). As duas baselines de início foram atualizadas; as outras seis permanecem iguais. Build (incluindo TypeScript), lint e diff check passaram. Lighthouse não foi repetido. Tudo permanece local, sem commit, push ou deploy.


## Recibo, eventos de estoque e alinhamento da carteira — 18/10/2026

O recibo usa margens automáticas em um contêiner flex com altura mínima da viewport e espaçamento simétrico. Fica centralizado quando cabe na tela; em telas baixas, cresce com o conteúdo sem cortar o início. Os selects de rede e tipo de carteira usam o mesmo intervalo de 8 px entre rótulo e controle dos campos adjacentes.

Eventos de estoque causados por uma compra confirmada incluem a conta e o pedido de origem. O cache continua atualizado, mas o comprador não recebe o aviso para revisar seu próprio carrinho. Alterações externas continuam avisando e invalidando a cotação. Pedidos recusados não emitem atualizações de estoque.

Foram aprovados **18 casos direcionados distintos**, em desktop/mobile: recibo e centralização em telas de 1000/600 px, alerta externo e ausência de alerta na própria compra, recusa, timeout, reconexão, cliques repetidos, persistência/alinhamento da carteira e reflow/overflow. A primeira execução teve 17 aprovações e um timeout no novo seletor de teste de carteira; após corrigir o seletor para o papel de combobox, esse caso passou na reexecução desktop. [Execução direcionada](../reports/playwright-receipt-wallet/index.html) e [reexecução da carteira](../reports/playwright-wallet-alignment/index.html).

Build (incluindo TypeScript), lint e diff check passaram. Não foram atualizadas baselines nesta etapa. A última execução completa de 76 testes permanece a da etapa anterior; Lighthouse não foi repetido. Alterações locais, sem commit, push ou deploy.


## Paginação, compra e menu inferior mobile — 18/10/2026

O catálogo usa até 6 NFTs por página até 768 px e mantém 9 no desktop. A paginação é manual, preserva a posição e o placeholder dos cards durante a consulta e continua na URL/histórico. Não há carregamento automático ao rolar, deixando as informações abaixo do catálogo próximas. A mudança de viewport ajusta uma página acima do limite à última disponível, sem criar outra entrada no histórico. O tamanho da página participa do cache e do parâmetro REST `pageSize`.

A barra de compra mobile passou de 164 para 140 px, mais safe area quando presente. O botão principal mede 168 × 48 px, o carrinho 48 × 48 px e os controles de quantidade 20 × 28 px. O botão de menos desabilitado mantém fundo sólido e não usa borda preta ou opacidade no elemento inteiro. A quantidade mínima continua sendo 1. O menu inferior passou a ter um recorte ao redor do botão central, em vez da sombra circular preta. A forma principal usa CSS shape; a alternativa usa máscara radial. A captura Figma do frame mobile foi recuperada para comparação visual, junto da referência enviada pelo usuário.

Build (incluindo TypeScript), ESLint e diff check passaram. Os **82 testes completos de produção passaram**, em Chromium desktop/mobile, com dois workers: [relatório](../reports/playwright-mobile-pagination/index.html). Antes da suíte completa, os 10 testes direcionados da implementação final também passaram. Foram atualizadas somente as referências de início e detalhe mobile; as outras seis foram preservadas em relação à etapa anterior. Lighthouse não foi repetido. As alterações permanecem locais, sem commit, push ou deploy.


## Banner e ícone de filtros conforme referência mobile — 18/10/2026

O banner de 190 px usa a arte Emerald Ape e a miniatura Sage Nomad sobreposta no canto inferior esquerdo, com as imagens locais já exportadas. O fundo combina um degradê com duas formas curvas, os indicadores de 40 × 8 px ficam centralizados e a arte principal não cresce além de 138 px. O título e a descrição ajustam a fonte em telas estreitas para manter o link Explorar visível em 320 px. O botão de filtros mantém 45 × 45 px, nome acessível e foco; o SVG Settings2 de 24 × 24 px reproduz os dois controles circulares da referência.

A comparação visual usou a imagem enviada pelo usuário e capturas locais em 414 e 320 px. A consulta ao contexto Figma e à captura foi bloqueada pelo limite de chamadas do plano nesta etapa; os assets já existentes foram reutilizados. Os **12 testes direcionados de produção passaram**, em desktop/mobile: geometria dos cards/banner e centralização do filtro em 320, 390, 414, 683, 768, 1024 e 1440 px, filtros/ordenação, teclado/foco, barra de compra, regressão visual e assets/overflow. [Relatório](../reports/playwright-banner-refinement/index.html).

Somente a baseline de início mobile foi atualizada; as outras sete foram preservadas em relação à etapa anterior. Build (incluindo TypeScript), lint e diff check passaram. A última execução completa de 82 testes continua sendo a etapa de paginação anterior; Lighthouse não foi repetido. Tudo permanece local, sem commit, push ou deploy.


## Menu da conta, avatar e paginação — 18/10/2026

A seta de próxima página não é renderizada quando a API retorna somente uma página. No mobile, a navegação da conta passou de links distribuídos em linhas para um painel recolhível: identifica a seção atual, abre uma lista vertical com itens de 46 px, destaca o destino ativo e fecha ao navegar ou pressionar Escape, retornando o foco ao controle. O menu geral do cabeçalho também usa lista vertical, estado expandido e Escape. A referência de interação é o padrão [Disclosure Navigation da W3C](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/), adaptado ao visual do projeto.

O avatar compartilhado usa contorno circular laranja e ícone de pessoa quando não existe foto. O editor mostra a prévia do arquivo; após salvar, o cabeçalho e o resumo da conta recebem a imagem persistida pela API. Upload, refresh, remoção e troca de conta foram verificados. Capturas locais conferiram o menu aberto e fechado em 390 px.

Build (incluindo TypeScript), lint e diff check passaram. Os **88 testes completos de produção passaram**, em Chromium desktop/mobile, com dois workers: [relatório](../reports/playwright-account-navigation/index.html). Antes da suíte completa, 16 testes direcionados passaram. Foram atualizadas somente as baselines de pagamento desktop e carrinho mobile; as outras seis foram preservadas nesta etapa. Lighthouse não foi repetido. Tudo permanece local, sem commit, push ou deploy.


## Layout da conta, sobreposição e ações móveis — 18/10/2026

Restaurei o menu lateral e o editor de avatar originais no desktop; o cabeçalho mantém avatar e “Perfil”. O cabeçalho mobile tem somente busca, carrinho e hamburger. Os menus geral e da conta ficam sobre o conteúdo, sem deslocar o formulário; fecham por clique fora, navegação e Escape, com retorno do foco ao controle neste último caso.

O botão central faz rolagem suave até o catálogo e funciona também ao repetir o mesmo hash, preservando os filtros. Movimento reduzido usa rolagem instantânea. Salvar fica fixo no rodapé mobile, acompanha o scroll e aparece com fade/deslocamento de 160 ms; a preferência por movimento reduzido remove a animação. Há espaço reservado para não cobrir o último campo e o feedback aparece na própria barra. O desktop mantém o botão no fluxo original.

Build (incluindo TypeScript), lint e diff check passaram. Os **20 testes direcionados de produção passaram**, em desktop/mobile: [relatório](../reports/playwright-floating-profile-actions/index.html). Incluem geometria dos menus, foco, avatar, rolagem repetida, filtros preservados, posição do botão, persistência do perfil, movimento reduzido, regressão visual e assets/overflow. A suíte atual tem 92 casos e não foi executada integralmente nesta etapa; a última execução completa aprovou 88. Somente a baseline de pagamento desktop foi atualizada para “Perfil”; as outras sete foram preservadas. Lighthouse não foi repetido. Alterações locais, sem commit, push ou deploy.


## Salvar somente alterações e topo do perfil — 18/10/2026

O botão Salvar só é renderizado quando nome, usuário, e-mail, ENS, apelido, avatar ou campos de senha diferem da versão salva. Desfazer as mudanças remove a barra; uma resposta de sucesso atualiza a referência e remove o botão, mantendo a confirmação no formulário. O topo mobile usa o componente MobileTitle com “Perfil” e seta para o início, como no carrinho; o desktop mantém seu cabeçalho.

Build com TypeScript e lint passaram. Os testes de navegação da conta verificam também ausência inicial do botão, edição, reversão, remoção após salvar e título/link mobile. Alterações locais, sem commit, push ou deploy.

Os **10 testes direcionados de produção passaram** nos dois perfis: [relatório](../reports/playwright-profile-dirty/index.html). Nenhuma baseline foi atualizada; a suíte completa não foi repetida.


## Topo de Carteiras e Lista de interesse — 18/10/2026

Estendi MobileTitle às duas telas, com título próprio e seta de retorno ao início, substituindo o cabeçalho geral somente no mobile. A navegação da conta continua disponível pelo painel Minha conta. O desktop conserva seu cabeçalho e layout. Build com TypeScript, lint e diff check passaram.

Os **10 testes direcionados de produção passaram**, nos dois perfis, incluindo navegação até Carteiras/Lista de interesse, títulos, cabeçalho oculto e retorno ao início: [relatório](../reports/playwright-account-titles/index.html). Nenhuma baseline atualizada; suíte completa não repetida. Sem commit, push ou deploy.


## Validação para integração e publicação das branches — 18/10/2026

Separei os refinamentos acumulados após d0ecf79 em quatro branches e integrei cada uma à main com merge explícito, preservando o histórico anterior. Os builds dos três estados intermediários de código passaram em uma worktree separada, assim como o lint da integração final. Comparei os 292 arquivos dos builds local e integrado por SHA-256: são idênticos.

Após gerar o build final, os **92 testes completos de produção passaram**, com dois workers e perfis desktop/mobile: [relatório](../reports/playwright-pre-push/index.html). As oito baselines foram preservadas. Os checks de whitespace de código e documentação passaram; os dados históricos gerados pelo Playwright foram preservados sem edição. Lighthouse não foi repetido. A organização retrospectiva e as branches estão descritas em [VERSIONING.md](VERSIONING.md).


## Aviso da fonte no Firefox — 18/10/2026

O WOFF2 original do Fontsource 5.3.0 define U+00A0 como composto do glifo space vazio. Normalizei esse caractere como glifo simples vazio, preservando métricas e mapeamento. Comparei os contornos de todos os glifos nos pesos 100/400/500/700 com DecomposingRecordingPen e as métricas hmtx: idênticos. Não restam componentes vazios e a regeneração é determinística. O script de imagens não sobrescreve mais a fonte corrigida; procedimento opcional em [FONTS.md](FONTS.md).

Build com TypeScript, lint e diff check passaram. Firefox 157 carregou a fonte via FontFaceSet, com U+00A0 e texto acentuado, sem erros JavaScript. Os **4 testes de regressão visual e assets/overflow passaram**, em desktop/mobile, sem atualizar baselines: [relatório](../reports/playwright-font-fix/index.html). A suíte completa de 92 casos não foi repetida e Lighthouse não foi executado novamente nesta correção.
