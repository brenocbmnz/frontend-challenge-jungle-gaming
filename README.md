# Kurio — NFT Marketplace

Desenvolvi este projeto para o [desafio frontend da Jungle](https://github.com/junglegaming/frontend-challenge), seguindo o [Figma original do desafio](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1&p=f&t=M8JHLECPG2jJbmct-0).

Implementei os fluxos de descoberta, compra e conta do colecionador em desktop e mobile. Usei React e TypeScript, TanStack Router e Query, Axios, Tailwind CSS, shadcn/ui (Button e Dialog personalizados para o Figma), MSW e Socket.IO. Para validar a entrega, incluí testes com Playwright e auditorias com Lighthouse.

**Aplicação publicada:** https://frontend-challenge-jungle-gaming-rosy.vercel.app/

## Como executar

Utilizei Node.js 22.12+ e npm. Configurei a aplicação para funcionar com uma API simulada no navegador, sem depender de um backend ou serviço privado.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Abra http://localhost:5173.

Na configuração padrão, `VITE_ENABLE_MOCKS=true`, o MSW inicia antes da interface e também funciona no build publicado. Para usar serviços externos, altere para `VITE_ENABLE_MOCKS=false` e forneça uma API compatível em `/api` e o serviço Socket.IO. A avaliação pode ser feita com a configuração padrão.

## Contas para avaliação

Preparei duas contas fictícias:

| E-mail           | Senha     |
| ---------------- | --------- |
| nova@kurio.test  | Kurio123! |
| breno@kurio.test | Kurio123! |

Também implementei o cadastro de novas contas. No cadastro, login e perfil, normalizei o e-mail para ignorar espaços nas extremidades e diferenças entre maiúsculas e minúsculas. A senha é comparada exatamente como foi digitada. Nos mocks, persisto apenas seu hash SHA-256 com prefixo de domínio; essa solução é demonstrativa e não representa autenticação de produção.

## Fluxos disponíveis

Implementei as rotas `/`, `/nft/:id`, `/carrinho`, `/pagamento`, `/pedido/:id`, `/login`, `/cadastro`, `/perfil`, `/carteiras`, `/favoritos` e `/demonstracao`.

No catálogo, mantive busca, filtros, ordenação e paginação na URL para permitir refresh e navegação pelo histórico. Os menus superiores navegam suavemente pelas seções, preservando os filtros. No desktop, a paginação mantém a posição da tela e os cards durante o carregamento. No mobile (até 768 px), limito a listagem a 6 NFTs por página, com botões de paginação e sem carregamento automático ao rolar. Assim, as informações abaixo do catálogo continuam próximas da listagem. A página selecionada também permanece na URL e no histórico. Os efeitos respeitam a preferência por movimento reduzido. No mobile, organizei a navegação da conta em um painel recolhível com a seção atual destacada, que abre sobre o conteúdo sem deslocar o formulário. No mobile, mantenho o avatar no painel da conta e no formulário, com borda laranja e a foto salva; as telas de Perfil, Carteiras e Lista de interesse usam título e seta de retorno no topo. Nas demais telas, o cabeçalho mobile tem apenas busca, carrinho e menu. No desktop, mantive a lateral e o editor originais, com avatar e rótulo “Perfil” no cabeçalho. Para sair no mobile, uso Minha conta → Sair. Mantive o Salvar flutuante no rodapé do perfil mobile, visível somente quando há alterações, com uma entrada leve, e a rolagem suave do botão central até o catálogo; ambos respeitam movimento reduzido.

Protegi checkout, recibos, favoritos, perfil e carteiras com sessão. Ao entrar, o usuário retorna ao destino anterior e o carrinho do visitante é mesclado com o da conta, respeitando o estoque. Configurei a sessão para durar uma hora; logout e expiração limpam o cache privado e encerram a conexão anterior.

Para testar uma compra, adicione um NFT, entre com uma das contas acima e avance para o pagamento. Escolha uma rede com carteira cadastrada, conecte a carteira simulada e revise os dados antes de confirmar. Ao trocar carteira, rede ou provedor, é necessário conectar e revisar novamente. No mobile, expanda “Dados do colecionador” para editar os campos adicionais e a observação.

## Como avaliar as simulações

Implementei os cenários abaixo para reproduzir as condições de rede e falhas pedidas na [seção 6 do desafio](https://github.com/junglegaming/frontend-challenge#6-mocking-com-msw). Eles permitem observar os estados de carregamento, as mensagens de erro e a recuperação da interface.

Abra `/demonstracao`, selecione uma opção em **Cenário** e clique em **Aplicar cenário**. Depois, navegue para o fluxo que deseja avaliar. Para repetir uma consulta sem aproveitar o cache, recarregue a página ou faça uma nova busca.

| Cenário                     | O que simulei                                                                                                                 | O que observar                                                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `default`                   | Respostas normais da API.                                                                                                     | Os fluxos devem funcionar com sucesso.                                                                                                           |
| `empty`                     | Catálogo sem resultados.                                                                                                      | A interface deve explicar que não encontrou NFTs e permitir limpar a busca.                                                                      |
| `slow`                      | Uma espera de 1,8 segundo nas requisições REST.                                                                               | Ao abrir catálogo, detalhe ou resumo do carrinho sem dados em cache, devem aparecer os skeletons: blocos temporários que indicam o carregamento. |
| `out-of-order`              | Tempos de resposta diferentes: buscas com uma letra levam 1,4 segundo; as buscas com mais caracteres levam 100 milissegundos. | Uma pesquisa antiga não deve substituir os resultados da pesquisa mais recente, mesmo que termine depois.                                        |
| `offline`                   | Falha de conexão, sem uma resposta HTTP.                                                                                      | A interface deve informar o problema e permitir tentar novamente.                                                                                |
| `server-error`              | Resposta HTTP 503, representando indisponibilidade do servidor.                                                               | A consulta deve exibir erro e oferecer recuperação.                                                                                              |
| `expired`                   | Sessão não autorizada pela API.                                                                                               | O usuário deve conseguir entrar novamente e retomar o fluxo.                                                                                     |
| `favorite-error`            | Falha ao salvar um favorito.                                                                                                  | A alteração otimista deve ser desfeita, restaurando o estado anterior.                                                                           |
| `price-change` / `sold-out` | Mudança de preço ou esgotamento de uma edição durante a compra.                                                               | O checkout deve impedir o envio com a cotação antiga e pedir nova revisão.                                                                       |
| `order-timeout`             | Criação do pedido seguida de uma demora maior que o limite de espera do cliente.                                              | Ao recuperar a tentativa, o sistema deve consultar o mesmo pedido, sem criar outra compra.                                                       |
| `payment-refused`           | Recusa do pagamento simulado.                                                                                                 | O pedido deve mostrar a recusa e preservar os itens do carrinho.                                                                                 |
| `wallet-refused`            | Recusa da conexão com a carteira.                                                                                             | A interface deve mostrar a falha e permitir uma nova tentativa.                                                                                  |

Os tempos são regras dos mocks para tornar a avaliação reproduzível; não representam a velocidade de um servidor real.

Para avaliar `out-of-order`, envie uma busca com uma letra e, enquanto ela estiver carregando, faça outra pesquisa mais específica. O resultado final deve corresponder à segunda busca. Também incluí um teste automatizado para reproduzir essa sequência sem depender da velocidade de digitação:

```sh
npx playwright test --grep 'respostas fora de ordem'
```

Para voltar ao estado inicial, selecione `default` em `/demonstracao` e clique em **Resetar todos os dados**. O reset restaura catálogo, contas, senhas, sessões, carrinhos, favoritos, carteiras e pedidos. Apenas aplicar `default` muda o cenário sem apagar as alterações anteriores.

Para testar cupons, use `KURIO10` para obter 10% de desconto, `EXPIRED` para simular um cupom expirado ou outro código para testar um cupom inválido.

## Como avaliar as atualizações em tempo real

Implementei os eventos passando pelo cliente Socket.IO e pela interceptação do MSW. Para testar uma alteração de preço durante a compra:

1. Adicione Emerald Ape ao carrinho, entre, conecte uma carteira e abra a revisão da compra.
2. Mantenha o checkout aberto e execute o comando abaixo no console do navegador.
3. Confira se o total é atualizado e se a interface exige uma nova revisão antes da confirmação.

```js
await fetch("/__mock/event", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "price",
    id: "1",
    duplicate: true,
    stale: true,
  }),
});
```

Nesse comando, incluí eventos duplicados e antigos para verificar se a interface ignora atualizações que não devem ser reaplicadas. Para outros casos, use `type: 'sold-out'` para esgotar o NFT, `'disconnect'` para interromper a conexão ou `'expire'` para expirar a sessão.

Também disponibilizei botões para esses eventos em `/demonstracao`. Para observar a mudança durante o checkout, use o console na mesma aba: os mocks não funcionam como um servidor compartilhado entre abas.

## Testes, build e auditoria

Disponibilizei os seguintes comandos:

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
npx playwright install chromium
npm test
PLAYWRIGHT_PRODUCTION=1 npm test # após o build, testa a versão otimizada
npm run test:report
npm run test:export # copia o relatório HTML para reports/playwright
npm run audit
```

Na última execução completa, os **92 testes de produção passaram** em Chromium desktop e mobile. Mantive contextos isolados, controle de relógio e cenários reproduzíveis. O relatório Playwright fica em `playwright-report/`; screenshots e traces de falhas ficam em `test-results/`. Os resultados e as condições das auditorias estão nos documentos abaixo.

Para executar os testes de produção em outra porta, use `PLAYWRIGHT_PORT=4183 PLAYWRIGHT_PRODUCTION=1 npm test`. O comando `npm run test:update` atualiza as imagens de referência dos testes visuais; essas alterações precisam ser revisadas antes de serem aceitas.

Incluí também `node scripts/optimize-assets.mjs` para recriar as versões WebP responsivas, preservando os assets originais. A fonte local normalizada já está versionada; documentei a regeneração em [FONTS.md](docs/FONTS.md).

## Publicação e documentação

Publiquei a aplicação na Vercel e incluí configuração para Vercel e Netlify, com build em `dist` e fallback das rotas. O procedimento está em [DEPLOY.md](docs/DEPLOY.md).

Organizei os detalhes da implementação nestes documentos:

- [Origem e personalização dos componentes shadcn/ui](docs/SHADCN.md)
- [Contratos REST e eventos](docs/API.md)
- [Arquitetura, decisões e limitações](ARCHITECTURE.md)
- [Validações realizadas](docs/VALIDATION.md)
- [Testes e relatório Playwright](docs/TEST_REPORTS.md)
- [Resultados Lighthouse](reports/lighthouse/README.md)
- [Galeria da revisão visual](reports/design-review/index.html)

Mantive imagens, SVGs e fontes no projeto para permitir a execução local. Os arquivos em `design/reference/` reúnem as referências usadas durante a implementação. Registrei os desvios e limites da comparação com o Figma em `ARCHITECTURE.md` e na documentação da revisão visual.

Conforme o escopo do desafio, simulei autenticação, transações, links de exploração e conexões de carteira. Não há movimentação de fundos. Login social e recuperação de senha informam a limitação; páginas editoriais, suporte, atividade, ofertas e downloads não fazem parte da implementação.

## Organização do histórico

Organizei os refinamentos recentes em branches por assunto e integrei cada uma à `main` com um commit de merge. Fiz essa separação após a implementação; os commits registram essa organização, sem representar uma cronologia anterior. Os detalhes estão em [VERSIONING.md](docs/VERSIONING.md).
