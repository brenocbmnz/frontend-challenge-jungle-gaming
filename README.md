# Kurio — NFT Marketplace

Implementação do [desafio Jungle](https://github.com/junglegaming/frontend-challenge), usando o [Figma de Breno](https://www.figma.com/design/Cr33D1M0iVHRVZBUpr7uov/Frontend-Challenge---Breno).

**Aplicação publicada:** https://frontend-challenge-jungle-gaming-rosy.vercel.app/

## Executar

Node.js 22.12+ e npm. Nenhum backend ou serviço privado é necessário.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Abra http://localhost:5173. O MSW inicia antes da aplicação e fica ativo também no build de demonstração. `VITE_ENABLE_MOCKS=false` desativa os mocks; nesse caso é necessário fornecer uma API compatível em `/api` e o serviço Socket.IO.

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
npx playwright install chromium
npm test
PLAYWRIGHT_PRODUCTION=1 npm test # após o build, valida a entrega otimizada
npm run test:report
npm run test:export # prepara reports/playwright/index.html para a entrega
npm run audit
```

`node scripts/optimize-assets.mjs` recria as versões WebP responsivas e copia a fonte local preservando os assets originais.

`PLAYWRIGHT_PORT=4183 PLAYWRIGHT_PRODUCTION=1 npm test` permite validar uma cópia isolada em outra porta.

`npm run test:update` gera/atualiza as baselines visuais. Revise as imagens antes de aceitar mudanças. O relatório Playwright fica em `playwright-report/`; screenshots e traces de falha ficam em `test-results/`. Os testes usam contextos isolados, relógio controlado e passam por MSW e socket.io-client.

No pagamento, escolha uma rede com carteira cadastrada; a conexão e a revisão precisam ser refeitas ao trocar carteira, rede ou provedor. No mobile, expanda “Dados do colecionador” para editar os campos adicionais e a observação.

## Publicar

Projeto preparado para Vercel e Netlify, com build em `dist` e fallback de rotas. Veja o [passo a passo de deploy](docs/DEPLOY.md).

## Contas fictícias

| E-mail | Senha |
| --- | --- |
| nova@kurio.test | Kurio123! |
| breno@kurio.test | Kurio123! |

Também é possível criar uma conta. Cadastro, login e perfil ignoram espaços externos e diferenças entre maiúsculas e minúsculas no e-mail; a senha é preservada exatamente como digitada. Apenas hashes SHA-256 com prefixo de domínio são persistidos nos mocks. Esta simulação não representa um sistema de autenticação de produção.

## Rotas

`/`, `/nft/:id`, `/carrinho`, `/pagamento`, `/pedido/:id`, `/login`, `/cadastro`, `/perfil`, `/carteiras`, `/favoritos` e `/demonstracao`.

Checkout, recibos, favoritos, perfil e carteiras exigem sessão. O login conserva o destino e mescla o carrinho visitante com o do usuário respeitando o estoque. A sessão dura uma hora. Logout e expiração eliminam cache privado e encerram a conexão anterior.

## Cenários reproduzíveis

Use `/demonstracao` para selecionar cenários, resetar todos os dados ou emitir eventos. O reset restaura catálogo, usuários, senhas, sessões, carrinhos, favoritos, carteiras e pedidos. Cupom válido: `KURIO10` (10%); `EXPIRED` representa cupom expirado.

| Cenário | Resultado |
| --- | --- |
| default | Fluxo de sucesso |
| empty | Catálogo vazio |
| slow | Latência de 1,8 s e skeletons |
| out-of-order | Busca de um caractere atrasa 1,4 s; outras 100 ms |
| offline | Erro de conexão na camada de rede |
| server-error | HTTP 503 |
| expired | Sessão não autorizada |
| favorite-error | Mutation de favorito falha, com rollback |
| price-change / sold-out | Cotação muda na tentativa de compra |
| order-timeout | Pedido é criado, mas a resposta falha; recuperar mantém o mesmo pedido |
| payment-refused | Pedido termina recusado e mantém os itens |
| wallet-refused | Conexão de carteira recusada |

Para testar tempo real, adicione Emerald Ape ao carrinho, entre, conecte uma carteira e abra a revisão. Mantenha o checkout aberto e envie pelo console do navegador:

```js
await fetch('/__mock/event', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'price', id: '1', duplicate: true, stale: true })
})
```

A UI deve atualizar o total e exigir revisão. `type: 'sold-out'` esgota a obra; `'disconnect'` interrompe o transporte; `'expire'` expira as sessões. Os mocks são locais à aba: múltiplas abas não constituem um servidor compartilhado em tempo real.

## Documentação

- [Contratos REST e eventos](docs/API.md)
- [Arquitetura e decisões](ARCHITECTURE.md)
- [Verificação e pendências](docs/VALIDATION.md)
- [Relatório Playwright](docs/TEST_REPORTS.md)
- [Resultados Lighthouse](reports/lighthouse/README.md)
- [Galeria da revisão visual](reports/design-review/index.html)

Os arquivos em `design/reference/` preservam o contexto de design recebido; não são código da aplicação. Imagens, SVGs e a fonte são locais. Transações, links de exploração e conexões de carteira são simulados; não há movimentação de fundos.
