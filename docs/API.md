# Contratos REST e eventos

Base `/api`. JSON. Toda chamada REST da aplicação passa pelo Axios. Credenciais fictícias via `Authorization: Bearer <token>`; visitante por `X-Guest-Id`. Valores monetários são strings decimais; quantidade e versão são inteiros. Os tipos completos estão em `src/api/contracts.ts`.

## Recursos

| Método / caminho | Entrada | Saída |
| --- | --- | --- |
| GET /nfts | q, categories (repetível), networks (repetível), min, max, sort, page, tab | items: Nft[], total, pages, counts |
| GET /nfts/:id | ID | Nft |
| POST /register | username, email, password, confirm | User seguro |
| POST /login | email, password | token, user |
| GET /session | Token | User seguro |
| POST /logout | Token | ok |
| GET /favorites | Token | string[] de IDs |
| PUT /favorites/:id | favorite: boolean | string[] atualizado |
| GET /cart | Identidade | items: CartItem[], coupon |
| PUT /cart | nftId, edition, quantity (0 remove) | Cart atualizado |
| POST /cart/coupon | code (vazio remove) | Quote |
| GET ou POST /quote | Identidade | Quote atual |
| GET /profile | Token | User |
| PATCH /profile | Dados, avatar Data URL, currentPassword/newPassword/confirm opcionais | User |
| GET /wallets | Token | Wallet[] |
| PUT /wallets/:id | Wallet; id=new cria | Wallet |
| POST /wallets/connect | walletId, network, provider | connected, wallet |
| POST /wallets/disconnect | Token | connected: false |
| POST /orders | quoteId, walletId, note, collector; cabeçalho Idempotency-Key | Order pendente ou pedido existente |
| GET /orders | Token | Pedidos do usuário |
| GET /orders/:id | Token | Order e snapshot |
| GET /orders/by-key/:key | Token | Order da tentativa |

Nft contém identidade, nome, token, imagem local, categoria, raridade (`rarity: "common" | "rare"`), rede, preço, estoque, edições e versão. A raridade é um metadado declarado das fixtures, independente da posição na listagem, do preço e da ordenação; somente `rare` recebe a tag “RARO”. O campo acompanha listagem, detalhe e eventos `nft.updated`. Dados locais anteriores recebem esse atributo na inicialização sem resetar contas, carrinhos ou pedidos. Quote contém linhas com preço unitário/subtotal/estoque/versão, subtotal, desconto, taxa, total, cupom, validade e conflitos. O campo opcional `token` das linhas da cotação contém o ID real do token; recibos antigos podem não conter esse campo. Order preserva quote e wallet no momento da compra, status, referência e data.

Wallet aceita também `displayName`, `email`, `profileName`, `ens`, `secondaryAddress` e `referral` opcionais no editor principal. Os campos são persistidos junto da carteira; e-mail informado é validado.

## Erros

Formato `{ message, fields?: Record<string,string>, code?: string }`.

- 401: sessão ausente ou expirada; redirecionar à autenticação preservando contexto.
- 404: recurso inexistente ou pertencente a outra conta; não vazar dados privados.
- 409: disponibilidade insuficiente, conflito de cadastro/carteira, idempotência ou cotação alterada (`QUOTE_CHANGED`).
- 422: campos ou cupom inválidos.
- 503 e falha de conexão: cenários transitórios reproduzíveis.

O mesmo token não dá acesso a pedidos de outro usuário. Estado privado não é retornado sem sessão válida.

O pedido valida nome, usuário, e-mail e os formatos dos campos opcionais informados (ENS, carteira secundária, indicação e limites de texto). Erros 422 incluem `fields` com as chaves de `Collector` ou `note`. A interface associa essas mensagens aos controles, sem tornar os campos opcionais obrigatórios.

## Eventos Socket.IO

Endpoint lógico `wss://realtime.kurio.test`, path `/socket.io/`, transporte WebSocket simulado pelo MSW. O evento de cliente `session` envia o token atual e associa a conexão à conta.

```ts
nft.updated: { id, resourceId, version, userId?, orderId?, nft: Nft }
order.updated: { id, resourceId, version, userId, order: Order }
```

A atualização de NFT modifica o mesmo banco consultado pela REST antes de emitir o evento. Pedidos são emitidos apenas às conexões da conta proprietária. Duplicatas e versões antigas não podem reverter cache ou efeitos.

## Controles de avaliação

`POST /__mock/reset { scenario? }`, `POST /__mock/scenario { scenario }`, `POST /__mock/event { type, id?, duplicate?, stale? }` e `GET /__mock/state`.

Os controles devem ser chamados pelo navegador sob o worker MSW; o request context do Playwright não atravessa o Service Worker. Não são uma API de produção.

Quando uma compra confirmada reduz o estoque, o evento `nft.updated` inclui `userId` e `orderId` da compra de origem. O cliente atualiza o cache normalmente, mas não exibe o alerta de revisão de carrinho para o próprio comprador. Atualizações externas continuam exibindo o aviso. Pedidos recusados não geram atualização de estoque.


### Tamanho das páginas do catálogo

`GET /api/nfts` aceita `pageSize=6` para o catálogo até 768 px; o padrão e os demais valores usam 9 itens por página. `items` e `pages` são calculados a partir desse tamanho, mantendo os filtros, busca, ordenação e contadores. A interface mostra somente os itens da página selecionada na URL, sem acumular páginas ou carregar itens ao rolar. O cache distingue os tamanhos para não misturar os resultados após mudança de viewport.
