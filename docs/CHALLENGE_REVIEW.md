# Conferência do enunciado — 17/10/2026

> As constatações abaixo registram a auditoria inicial. Após autorização, foram implementados seleção de rede no checkout, campos adicionais mobile, validação compartilhada, atalhos acessíveis e os testes complementares. O fechamento da validação está em [VALIDATION.md](VALIDATION.md). O usuário publicou na Vercel; a URL está no README e a conferência do host está em VALIDATION.md.

Fonte consultada nesta revisão: https://github.com/junglegaming/frontend-challenge (README, seções 1–12).

Esta é uma revisão de requisitos por leitura do código, documentação e testes existentes. Não é uma nova execução integral dos testes nem uma nova auditoria Lighthouse. Os 40 testes de produção aprovados foram executados na revisão anterior; essa aprovação não significa cobertura de todo cenário do enunciado.

## Fechamento da preparação

| Item | Situação |
| --- | --- |
| Checkout: rede, dados adicionais mobile e validação | Implementado |
| Atalho de conteúdo e associação dos erros aos campos | Corrigidos |
| Cenários adicionais de cupom, carteira, idempotência e reflow | Implementados em Playwright |
| Instalação sem dependências pré-existentes | `npm ci`, tipos, lint e build verificados em cópia isolada |
| Lighthouse atualizado | Medianas: desktop 100/100; mobile 92/93 em performance; demais categorias 100 |
| Relatórios HTML/JSON e configuração | Incluídos em `reports`, com detalhes em [VALIDATION.md](VALIDATION.md) |
| Deploy público e URL no README | Publicado pelo usuário; URL incluída e fluxo principal conferido |

## Já presente

- Stack obrigatória: React, TypeScript, TanStack Router/Query, Axios, REST, Socket.IO, Tailwind, componentes no padrão shadcn/ui sobre Radix, MSW, Playwright e Lighthouse.
- Rotas de catálogo, detalhe, carrinho, compra, recibo, autenticação, perfil e carteiras; adaptações mobile.
- Contratos tipados, Axios, persistência demonstrativa, sessão e isolamento do cache.
- Catálogo com estado na URL, favoritos otimistas com rollback, cotação em strings decimais e cálculos com BigInt.
- Pedidos idempotentes, snapshots, estados pendente/confirmado/recusado e recuperação.
- Eventos por socket.io-client e binding MSW, com versões, reconciliação e limpeza dos listeners.
- Dois usuários fictícios, cenários reproduzíveis e painel de demonstração.
- README, ARCHITECTURE.md, contratos REST/eventos, configuração de deploy, lockfile, assets locais e comandos de execução.
- Baselines versionadas das quatro telas exigidas em desktop/mobile; relatório HTML e traces configurados no Playwright.

## Constatações da auditoria inicial

### 1. Deploy público — requisito obrigatório ainda pendente

A seção 12 exige URL pública, além do repositório. `docs/DEPLOY.md` registra que a aplicação está preparada para Vercel/Netlify, mas não foi publicada nessas contas. A revisão visual continua local, por solicitação do usuário.

Após a aprovação visual: enviar a revisão ao repositório, publicar a mesma versão e incluir a URL no README. Verificar acesso direto/refresh de rotas, carregamento dos service workers, mocks e eventos Socket.IO no host publicado.

### 2. Auditoria final de performance — evidência desatualizada

As medições anteriores atendiam às metas, mas antecedem as mudanças de layout e renderização tipográfica. É necessário repetir três medições para início/detalhe × desktop/mobile, atualizar medianas, LCP/CLS/TBT e relatórios HTML/JSON, mantendo os mocks padrão ativos. Não é possível garantir as metas da versão atual a partir do relatório antigo.

### 3. Checkout — seleção de rede e acesso aos dados no mobile

A seção 3 pede dados do colecionador, seleção de carteira/rede e validação dos campos do layout.

- `src/pages/checkout.tsx` mostra a rede como campo `readOnly` e envia `activeWallet.network` na conexão. Existe seleção de rede no cadastro da carteira, mas falta uma escolha explícita de rede compatível durante o checkout.
- No mobile, `src/styles.css` oculta `.collector-form`; o diálogo de revisão oferece nome, usuário e e-mail. Os demais campos editáveis do checkout desktop e a observação não estão acessíveis nesse fluxo mobile. Convém oferecer uma etapa ou seção expansível com esses dados, preservando a tela inicial do Figma.
- A validação da revisão e do pedido verifica nome, usuário e e-mail. Os erros do checkout aparecem em mensagem geral; completar as validações pertinentes e a associação dos erros aos campos. Os campos documentados como opcionais não precisam ser tornados obrigatórios indiscriminadamente.

### 4. Testes — completar cenários e corrigir uma asserção

A seção 9 pede cobertura de cenários específicos. Os testes existentes são substanciais, mas a leitura mostrou lacunas:

- Cupom expirado e remoção explícita de cupom não têm casos dedicados; há teste de cupom inválido e válido.
- Recusa/desconexão da carteira tem implementação, mas falta um caso E2E dedicado de falha e recuperação dessa conexão.
- Atualização de carteira principal/secundária não está coberta tão completamente quanto criação de uma carteira.
- A verificação de overflow em 390/768/1440 percorre início, detalhe, carrinho, login e cadastro. Ampliar a conferência para pagamento, perfil, carteiras e recibo autenticados, além de verificar perda de conteúdo com zoom.
- Em `tests/marketplace.spec.ts`, o teste de edição indisponível chama `isDisabled()` sem conferir o booleano. Trocar por uma asserção efetiva, por exemplo `await expect(...).toBeDisabled()`.

Também é útil acrescentar um teste da chave de idempotência reutilizada com conteúdo diferente, exigência explícita da seção 5. O handler já retorna conflito nesse caso.

### 5. Acessibilidade e fidelidade — validação final

O link “Pular para o conteúdo” do roteador aponta para `#main-content`. Esse ID existe no componente Page, mas os `main` próprios de autenticação e recibo não o possuem. Corrigir os destinos para manter o atalho funcional nessas telas.

A revisão visual anterior documenta desvios e limitações. Os ajustes ópticos das promoções (17/13 px em vez de 18/14 px no contexto salvo) e outras decisões recentes estão em `docs/DESIGN_REVIEW.md`, mas o enunciado solicita os desvios em `ARCHITECTURE.md`: adicionar uma referência explícita ali. A comparação integral com o Figma ainda não está certificada.

### 6. Reprodutibilidade da entrega

Antes de enviar, executar instalação/build/testes em checkout limpo, com as versões declaradas. O relatório Playwright atual é local e ignorado pelo Git; disponibilizar seu HTML como artefato ou arquivo da entrega, conforme o canal utilizado, sem versionar traces de falhas já resolvidas como se fossem falhas atuais.

## Não é necessário acrescentar

Blockchain real, extensão real de carteira, gateway real, páginas editoriais, suporte, atividade, ofertas e downloads estão explicitamente fora do escopo. A prioridade deve ser fechar as pendências acima, sem ampliar o produto.

A auditoria inicial foi somente de leitura; as correções posteriores e a preparação da entrega foram autorizadas em seguida. Posteriormente, o usuário realizou a publicação na Vercel.
