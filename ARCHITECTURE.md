# Arquitetura

## Responsabilidades

- `src/api/contracts.ts`: contratos de transporte. ETH é uma string decimal com até 18 casas; quantidades são inteiros.
- `src/api/client.ts`: Axios, cancelamento, cabeçalhos de identidade e tratamento central de sessão expirada. Sem dados fictícios.
- `src/api/queries.ts`: chaves de cache por usuário e parâmetros, políticas de consulta e validação de search params.
- `src/mocks/`: servidor de demonstração. Fixtures, regras de negócio, persistência, REST e Socket.IO compartilham um banco. Nenhum componente cria respostas simuladas.
- `src/pages/`: fluxos da interface; `src/components/ui/`: componentes no padrão shadcn/ui sobre Radix, CVA e Tailwind.
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

Identidade do Figma: Roboto Mono, fundo `#140D0A`, superfície `#241612`, cobre `#D28A4C`, destaque `#E89B55`, texto `#F5F1EB`, secundário `#CFB28C`. Os quatro artworks originais reutilizados no Figma e os SVGs foram baixados para `public/assets`; a fonte vem de @fontsource e é incluída localmente, com preload. Versões WebP responsivas (320/480/960 px, qualidade 92) derivam dos PNGs originais, que permanecem preservados; não há alteração artística dos assets. `scripts/optimize-assets.mjs` reproduz essas derivações.

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
