# Arquitetura

## Responsabilidades

- `src/api/contracts.ts`: contratos de transporte. ETH é uma string decimal com até 18 casas; quantidades são inteiros.
- `src/api/client.ts`: Axios, cancelamento, cabeçalhos de identidade e tratamento central de sessão expirada. Sem dados fictícios.
- `src/api/queries.ts`: chaves de cache por usuário e parâmetros, políticas de consulta e validação de search params.
- `src/mocks/`: servidor de demonstração. Fixtures, regras de negócio, persistência, REST e Socket.IO compartilham um banco. Nenhum componente cria respostas simuladas.
- `src/pages/`: fluxos da interface; `src/components/ui/`: componentes Button e Dialog importados pelo CLI oficial do shadcn/ui e personalizados com Radix, CVA e Tailwind. O adaptador de carregamento/foco dos diálogos fica em `src/components/dialog*.tsx`. Origem, cópias dos arquivos instalados e adaptações estão em [docs/SHADCN.md](docs/SHADCN.md).
- `src/lib/money.ts`: conversão decimal ↔ wei por BigInt. Nenhum cálculo financeiro em ponto flutuante.

## Sessão e carrinho

Um identificador visitante estável é enviado em `X-Guest-Id`. Sessões fictícias usam token opaco e vencem em uma hora. As chaves de cache incluem usuário e sessão; logout/troca/expiração cancelam consultas e limpam o cache. O Socket.IO recria a assinatura por identidade e libera listeners ao desmontar.

O banco MSW persiste em `kurio.mock.v1` no localStorage. O token fica separado em `kurio.token`; a senha em claro não é armazenada. Essa persistência é exclusivamente demonstrativa. Cadastro, login e edição de perfil normalizam o e-mail com trim e conversão para minúsculas; conflitos usam a mesma comparação, inclusive para registros existentes. Senhas não são normalizadas. Campos de login vazios ou e-mail inválido retornam erros associados aos inputs; credenciais incorretas retornam uma mensagem genérica. As regras de login mesclam itens do visitante com os do usuário por NFT/edição, limitando a disponibilidade. Logout mantém o carrinho privado no servidor simulado, sem expô-lo ao próximo usuário.

## Consultas e mutations

TanStack Query é o estado remoto. Stale time de 30 s; refetch ao focar a janela e após reconexão; uma repetição de leitura para falhas transitórias, sem retries automáticos de mutations. Queries recebem AbortSignal do Query e o propagam ao Axios. Chaves com parâmetros isolam resultados; respostas antigas não substituem buscas novas.

Favoritos usam atualização otimista, cancelamento da leitura anterior e rollback ao falhar. Carrinho e cotação são invalidados após alterações; resumo e checkout exibem os valores da API.

## Compra e idempotência

A cotação identifica itens, quantidades, versões, preços e cupom. A revisão é invalidada quando a cotação muda. Há revalidação antes do envio e no handler de criação do pedido.

Uma tentativa guarda chave e payload em sessionStorage, por usuário. Uma falha de transporte não gera outra chave: recuperação consulta `/orders/by-key/:key` e, se não houve criação, reenvia com a mesma chave. Chave repetida com payload diferente retorna conflito.

O mock mantém pedido pendente com prazo persistido. O cenário de timeout cria o pedido e retém a resposta por 11 segundos, além do timeout de 10 segundos do Axios. Ao vencer, a rotina de liquidação ou uma leitura posterior confirma/recusa. Estados terminais não regridem. A confirmação guarda um snapshot e remove apenas quantidades efetivamente compradas; erros e recusas preservam o carrinho.

## Socket.IO

`socket.io-client` usa exclusivamente WebSocket. O MSW intercepta a conexão, e `@mswjs/socket.io-binding` codifica/decodifica o protocolo. Não existe substituição por setters da UI. O módulo Socket.IO carrega depois do MSW para evitar captura antecipada do construtor WebSocket. Router e inicialização dos mocks baixam em paralelo; a aplicação aguarda ambos antes de consultar dados. O wrapper `public/apiMockServiceWorker.js` limita a interceptação de fetch a `/api` e `/__mock`, importando o worker MSW gerado sem alterá-lo. Assets estáticos seguem a rede nativa; os cenários REST continuam passando pelos handlers MSW. O MSW normaliza o prefixo `/socket.io/`, portanto o handler corresponde ao domínio raiz.

Eventos possuem ID estável, recurso e versão. O cliente ignora versões repetidas/antigas; pedidos são filtrados por usuário. Reconexão invalida recursos ativos para reconciliar pela REST. Polling de pedidos pendentes a cada 1,5 s oferece recuperação adicional após perda de eventos ou refresh.

Limitações: o mock não é um servidor multiusuário compartilhado entre abas, não usa polling Engine.IO, rooms ou namespaces. A comunicação existe dentro do contexto da aba e o estado é recuperado do banco local ao recarregar. O reset e os controles de cenário são endpoints exclusivos da demonstração.

## Design e acessibilidade

Identidade do Figma: Roboto Mono, fundo `#140D0A`, superfície `#241612`, cobre `#D28A4C`, destaque `#E89B55`, texto `#F5F1EB`, secundário `#CFB28C`. Os quatro artworks originais reutilizados no Figma e os SVGs foram baixados para `public/assets`; a fonte vem de @fontsource e é incluída localmente, com preload. O componente vazio de U+00A0 foi normalizado sem alterar contornos ou métricas; a regeneração está em `docs/FONTS.md`. Versões WebP responsivas (320/384/480/640/960 px, qualidade 86, além de miniaturas 64/128/192 px) derivam dos PNGs originais, que permanecem preservados; não há alteração artística dos assets. `scripts/optimize-assets.mjs` reproduz essas derivações.

O layout usa grid/flex e adapta larguras intermediárias. Radix controla foco, Escape e confinamento dos diálogos. Inputs têm labels, erros associados, alternativa para mostrar senha, foco visível e áreas de toque. Skeletons mantêm proporções e respeitam movimento reduzido. Notificações assíncronas usam regiões de status.

Diferenças e pontos ainda sujeitos à revisão:

- O limite do plano Starter impediu obter contexto detalhado de início mobile, pagamento desktop, login desktop e carteiras desktop. Capturas de início mobile, pagamento desktop e carteiras desktop foram recuperadas e usadas para ajustar a composição; o login desktop continua sem referência completa. Não há certificação de fidelidade integral.
- Os campos ENS, carteira secundária e indicação são opcionais na simulação; nomes, usuário e e-mail permanecem validados.
- Estados não desenhados incluem carrinho vazio, erros, autenticação necessária, pedido pendente/recusado, revisão de cotação e diálogo para adicionar carteira secundária.
- Contagens refletem as fixtures e não os números ilustrativos do Figma. Informações de preço, nome e quantidade são dinâmicas.
- Conteúdo editorial abre aviso de indisponibilidade. Newsletter e links auxiliares fora do escopo não simulam sucesso. Login social e recuperação de senha informam a limitação.
- Perfil, carteiras e recibo foram adaptados para mobile conforme o enunciado.
- A confirmação indica explicitamente que a transação é simulada e apresenta referência textual em lugar de um link enganoso a um explorador real.

A revisão de medidas, capturas e ajustes ópticos posteriores à exportação está em [docs/DESIGN_REVIEW.md](docs/DESIGN_REVIEW.md). Nos cards promocionais desktop, título/descrição usam 17/13 px para evitar contato com a imagem e sobreposição com o botão nas métricas reais da fonte no navegador.

No pagamento, a rede é escolhida explicitamente entre as redes de carteiras cadastradas. Alterar a rede seleciona uma carteira compatível e invalida a conexão e a revisão anteriores; não altera silenciosamente o cadastro da carteira. A conexão é identificada por carteira, rede e provedor. No mobile, “Dados do colecionador” expande os mesmos campos do desktop. O diálogo mantém os três campos principais para edição rápida. Cliente e handler de pedidos compartilham a validação de transporte; erros são associados aos campos e o formulário é revelado quando precisa de correção.

## Publicação

Build estático em `dist/`, com assets e worker MSW incluídos. O build também gera variantes Brotli/gzip dos arquivos textuais. `npm run preview` serve essas variantes conforme Accept-Encoding e aplica fallback de SPA, preservando arquivos estáticos e 404 para assets ausentes. O CDN de produção pode aplicar sua própria compressão. O host deve servir `index.html` como fallback de rotas, mas preservar `/mockServiceWorker.js` e assets estáticos. Configurações para Vercel, Netlify e Cloudflare Pages acompanham a entrega.

O HTML apresenta um estado inicial acessível enquanto o MSW inicia. Ele é substituído pela aplicação React e evita uma tela vazia no primeiro carregamento, sem adiar ou desativar os mocks.

MSW fixado em 2.10.5, compatível com @mswjs/socket.io-binding 0.2.0. A versão 2.15 aumentava o chunk inicial de mocks de cerca de 269 KB para 450 KB; a versão selecionada preserva REST, WebSocket e os cenários usados na aplicação. O worker gerado acompanha a mesma versão.

O plugin `route-artwork-preload` do Vite deriva o mapa de imagens da própria fixture, sem duplicar dados do catálogo. O HTML antecipa o asset da rota atual usando o mesmo `srcset` e `sizes` da imagem renderizada, em todas as rotas de NFT conhecidas e na home. Rotas sem artwork não antecipam imagens do catálogo.

O build incorpora a folha CSS ao HTML antes de gerar Brotli/gzip, eliminando uma requisição bloqueante sem alterar regras ou o conteúdo visual. O cenário padrão não acrescenta espera artificial às respostas; `slow` mantém 1,8 s e `out-of-order` conserva suas latências específicas. `PLAYWRIGHT_PRODUCTION=1 npm test` valida o build pelo mesmo servidor estático comprimido usado no Lighthouse.

A entrada `src/main.tsx` permanece pequena e importa a interface (`src/app.tsx`) e a inicialização MSW em paralelo. O React só monta depois que o worker termina de registrar os handlers. Isso evita que a transferência e avaliação de React DOM bloqueiem o início dos mocks, preservando a ordem necessária para REST e Socket.IO. Na home sem filtros, as três artes iniciais do catálogo são antecipadas; imagens adicionais usam prioridade baixa para não competir com a fonte e os módulos essenciais. Nenhuma imagem, fluxo, mock ou funcionalidade é desativado para a auditoria.

## Feedback de interação e movimento

`src/interactions.css` acrescenta hover de cards, botões e navegação, realce de foco, movimento discreto de ícones, confirmação visual de favorito e entrada de diálogos/toasts. O estado de repouso conserva a composição do Figma; sombras e escalas não alteram o espaço ocupado pelos componentes. Hover com movimento só se aplica a dispositivos com mouse (`hover: hover` e `pointer: fine`).

A navegação usa a View Transition API pelo TanStack Router, com crossfade de 100–160 ms entre caminhos distintos. A primeira carga e mudanças apenas de busca/hash não recebem essa transição nos navegadores com suporte a tipos de transição. Navegadores sem View Transition API navegam normalmente; os que suportam a API antiga usam o crossfade padrão também em navegações de busca/hash. Não há atraso artificial nem nova dependência de animação. `prefers-reduced-motion: reduce` desativa animações, transições e deslocamentos, mantendo o feedback de cor e foco. Os skeletons continuam respeitando a mesma preferência.

## Navegação por seções e paginação

Os quatro menus superiores usam TanStack Router, preservando os filtros ao navegar entre seções da página inicial. As âncoras têm margem de 24 px; a rolagem é suave e passa a imediata quando `prefers-reduced-motion` está ativo, inclusive se a preferência mudar com a página aberta. O menu ativo acompanha a âncora. A navegação não recarrega o documento.

A paginação mantém o scroll (`resetScroll: false`, `hashScrollIntoView: false`) e o hash atual. Na troca apenas de página, TanStack Query conserva os cards anteriores como placeholder até chegar a resposta; mudanças de filtro continuam tendo seu próprio carregamento. Isso evita recolher a grade e deslocar os controles durante a consulta. Filtros e ordenação continuam reiniciando a paginação.

Respostas GET /cart são validadas antes de entrar no cache: items, coupon e cada linha devem corresponder ao contrato. Uma resposta inválida gera um erro recuperável, e o cabeçalho também protege o cálculo do contador. O teste cobre um estado persistido malformado que produz uma resposta HTTP 200 sem items; não certifica a causa do erro intermitente relatado pelo usuário.

Na faixa de 641–768 px, a grade passa a três colunas para evitar cards maiores que os do desktop. O celular mantém duas colunas e o desktop mantém as dimensões de referência do Figma. Não se aplica zoom global para reduzir a interface.

## Fluxo dos cards do catálogo

Todos os cards mostram nome e preço, inclusive o oitavo item de cada página. Não há ocultação por índice para reproduzir uma referência visual. O catálogo mantém os links completos em bloco e as linhas alinhadas, sem deslocar os cards pares por transform. Isso faz com que o grid reserve espaço real para o nome e o preço antes da próxima linha. O teste de layout cobre celulares, tablet e desktop, inclusive nomes que ocupam mais de uma linha.

O banner mobile segue a referência visual com arte principal e miniatura decorativa sobreposta no canto inferior esquerdo, ambas usando os assets locais exportados. O grupo mantém suas proporções e limita a arte principal a 138 px; título e descrição se ajustam até 320 px para manter o link Explorar dentro do banner de 190 px. Os indicadores usam o SVG local em seu tamanho original de 40 × 8 px, centralizado no banner. O controle de filtros usa Button no tamanho de ícone, com `aria-label="Filtros"`, e o ícone Settings2 de duas linhas com círculos, centralizado e com traço de 1,5 px. O desktop mantém sua composição anterior.

## Filtros, favoritos e raridade dos cards

Os filtros mantêm checkboxes nativos, estado checked e foco de teclado, mas a seleção visual usa apenas a cor do rótulo e da contagem, sem prefixo de checkmark. O favorito fica oculto nos cards até 768 px; o detalhe do NFT continua oferecendo a ação no mobile. No desktop, todos os cards revelam o coração ao passar o mouse pela arte ou pelo controle, com fade e deslocamento de 120 ms. A ação também aparece quando o link ou o botão recebe foco visível pelo teclado. Focar com um clique do mouse não mantém o coração permanentemente visível ao sair da imagem. Movimento reduzido desativa as transições.

A tag “RARO” é renderizada a partir de `Nft.rarity`, não do índice do card, e aparece em desktop e mobile. As fixtures declaram quais IDs são raros; esse dado não é inferido da imagem ou do preço. A inicialização preenche o campo nos dados antigos sem apagar os demais recursos. Os contratos REST e os eventos carregam o mesmo metadado.


## Paginação responsiva e controles mobile

Até 768 px, a API usa `pageSize=6`; no desktop, o padrão continua sendo 9. O tamanho participa da chave TanStack Query para não reutilizar páginas com tamanhos diferentes ao mudar de viewport. O campo `page` da URL identifica somente a página atual, tanto em mobile quanto em desktop. Filtros reiniciam a paginação; refresh e histórico recuperam a seleção. Se a mudança de viewport deixa a página acima do limite disponível, a URL é ajustada para a última página válida sem criar outra entrada no histórico. Durante uma troca de página com o mesmo tamanho, os cards anteriores ficam como placeholder e a posição da tela é preservada. A listagem não carrega itens automaticamente ao rolar, mantendo o acesso às seções seguintes.

A barra de compra mobile ocupa 140 px, acrescidos da safe area quando presente. O controle de menos mantém fundo sólido quando desabilitado. O menu inferior desenha o recorte em um pseudo-elemento separado dos links, usando `clip-path: shape()` com uma máscara radial como alternativa; o botão central não tem sombra circular preta. O recorte não impede foco ou clique nos links.


## Navegação de conta e avatar

No mobile, AccountSidebar usa um painel expansível: um botão identifica “Minha conta” e a seção atual, controla a lista vertical de links por `aria-expanded`/`aria-controls` e permite fechar com Escape retornando o foco ao botão. Os painéis mobile são posicionados de forma absoluta abaixo do controle e se sobrepõem ao conteúdo, sem alterar sua posição. O link ativo recebe `aria-current="page"`; ao selecionar outra seção, o painel fecha. O hook useDismissible fecha ao clicar ou focar fora e restaura o foco ao controle com Escape; os listeners são removidos ao fechar ou desmontar. O painel possui rolagem própria quando limitado pela altura da tela. Os itens têm altura mínima de 46 px. O desktop mantém a navegação lateral sempre visível; o botão e o resumo de “Minha conta” só são renderizados até 768 px. O menu geral do cabeçalho também usa links em lista e suporte a Escape. A referência de interação é o padrão [Disclosure Navigation da W3C](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/), adaptado às cores e tipografia da aplicação; os links preservam sua semântica de navegação.

UserAvatar é usado no cabeçalho desktop, resumo da conta mobile e editor do perfil mobile. O editor desktop conserva o avatar e o placeholder originais. O cabeçalho desktop usa o rótulo “Perfil”, com a tipografia existente; o mobile não renderiza esse acesso no cabeçalho e mantém somente busca, carrinho e menu. O contorno é circular e laranja; o ícone UserRound aparece quando não há imagem. O formulário mostra a prévia ao selecionar o arquivo. Após salvar, a consulta da sessão é invalidada e o avatar salvo aparece nos demais pontos. A persistência, validação de arquivo e isolamento entre contas continuam passando pela API mock e pelo cache da sessão.

A seta de próxima página só é renderizada quando a resposta da API informa mais de uma página. Na última página de um resultado com várias páginas, permanece desabilitada.


## Ações fixas e navegação para o catálogo no mobile

O botão central da navegação inferior preserva os filtros, usa `hashScrollIntoView` com rolagem suave e desativa a transição de página nessa navegação por âncora. Um novo toque quando a URL já contém `#catalogo` rola diretamente para a seção, evitando que a navegação para o mesmo hash seja ignorada. A preferência por movimento reduzido troca o comportamento por instantâneo; cliques com modificadores mantêm o comportamento normal do link.

Até 768 px, o grupo de ações do perfil fica fixo no rodapé da viewport, somente enquanto há alterações em relação à última resposta salva, incluindo avatar e campos de senha. Ao desfazer as alterações ou salvar, a barra é removida; a confirmação permanece no formulário. O grupo contém o botão Salvar, estado de envio e erros. Ele continua dentro do formulário e conserva a submissão e as validações existentes. O formulário reserva espaço inferior para deixar os últimos campos acessíveis acima da ação flutuante. A entrada usa fade e deslocamento de 6 px por 160 ms, desativados com movimento reduzido. No desktop, o grupo permanece no fluxo original.

Nas telas mobile da conta, MobileTitle mostra “Perfil”, “Carteiras” ou “Lista de interesse”, com retorno ao início, seguindo o padrão do carrinho e substituindo o cabeçalho geral. O desktop mantém o cabeçalho original.
