# Revisão visual local — 17/10/2026

Revisão do catálogo, detalhe do NFT, carrinho, entrar, cadastro, perfil, carteiras, pagamento, revisão da compra e recibo. As capturas de conferência usam 1440 × 1000 no desktop e 414 × 896 no mobile, além da verificação automatizada de overflow em 390, 768 e 1440 px.

## Referências e precisão

Foram usados os contextos de alta fidelidade salvos em `design/reference`, os PNGs originais disponíveis nessa pasta e a exportação enviada na conversa. Novas consultas ao Figma estão bloqueadas pela cota da integração. As imagens geradas a partir dos contextos são reconstruções auxiliares, não screenshots originais do Figma. Não há base para declarar equivalência pixel a pixel de todas as telas.

## Diferenças encontradas e ajustes

| Área | Antes | Ajuste local |
| --- | --- | --- |
| Tipografia | O arredondamento dos avanços da fonte no Chromium alterava a largura das palavras e as quebras. | Renderização geométrica, mantendo a Roboto Mono local. |
| Ordenação | Select nativo colado ao rótulo, com linha de base diferente. | Rótulo e valor alinhados ao centro, intervalo de 10 px e seta exportada do Figma; select nativo preservado para interação. |
| Barra do catálogo | Altura de 31 px onde o contexto define 18 px. | Altura de 18 px, intervalo de 32 px até a grade e sublinhado das abas separado do fluxo. |
| Preços do catálogo | Entrelinha maior aumentava a altura das fileiras. | Entrelinha de 16 px no desktop e intervalo de 6 px entre nome e preço a partir da segunda fileira, conforme os grupos do contexto. |
| Promoções | Texto dependia do espaço restante do flex e se aproximava da imagem. | Área de texto com largura e alinhamento próprios, títulos em duas linhas e botões alinhados. A descrição ganhou espaço suficiente para evitar sobreposição com o botão. No desktop, o ajuste óptico final usa título de 17 px e descrição de 13 px, em vez dos 18/14 px do contexto, para preservar as duas linhas do título e afastar o texto da imagem com a fonte renderizada no navegador. |
| Avaliações | Uma estrela Lucide junto de caracteres de texto, com tamanhos e desenhos diferentes. | Cinco SVGs exportados, incluindo a última estrela específica do design, com caixas de alinhamento iguais. Badge mobile usa seu próprio SVG. |
| Galeria do produto | Miniaturas de 101 px e arte principal de 412 px. | Miniaturas de 100 px; arte de 404 px centralizada na superfície de 444 px; controle de ampliação exportado. |
| Compra no detalhe | Quantidade e botões menores que a referência desktop. | Controles de quantidade de 33 × 49,5 px e botões de compra/favoritar de 40 px de altura. |
| Compartilhamento | Apenas texto de copiar link. | Ícones exportados para LinkedIn, cópia e X, com nomes acessíveis. |
| Detalhe mobile | Seções desktop prolongavam a tela para mais de 3.700 px. | Composição mobile com galeria, ficha e barra de compra, conforme o contexto específico. |
| Diário da Cunhagem | Larguras dos cards, título e organização interna diferentes; último artigo com texto e data divergentes. | Cards de 268 px, título de 28 px, conteúdo em coluna com intervalos de 8 px e texto do último artigo restaurado. |
| Rodapé | Painel superior crescia até 290 px; redes sociais e carteiras ficavam encostadas. | Painel de 250 px no desktop, faixa de marca de 88 px, colunas de 236 px e separação entre redes e carteiras. |
| Entrar/cadastro | Camada escura ocultava quase todo o catálogo ao fundo. | Fundo desktop visível conforme a referência de cadastro. |
| Perfil | Ícones genéricos/ausentes e ordem das entradas divergente. | Ícones exportados e ordem do design; espaços do formulário e placeholder do avatar ajustados. |
| Campos de senha | Ícone genérico diferente. | SVG exportado no estado de senha oculta; alternância funcional preservada. |
| Pagamento desktop | Duas colunas iguais, com quebra de rótulos e resumo excessivamente alto. | Colunas de 763/405 px, intervalo de 32 px, formulário reorganizado, cabeçalho dos itens, linhas compactas e observação de 350 × 152 px. |
| Escolha de carteira | Lista adicional permanente alongava o desktop. | Lista expansível por “Usar outra carteira?”, mantendo seleção, conexão e troca funcionais. No mobile, os cartões continuam visíveis. |
| Cupom no pagamento | Formulário permanente ocupava espaço extra. | Exibição sob demanda; regras do cupom preservadas. |
| Token no carrinho | Código interno do registro aparecia como ID do token. | Cotação passa a carregar o token real; fallback preserva recibos antigos. |
| Confirmação | Página com cabeçalho/rodapé e ícone genérico. | Recibo focado de 578 px, símbolo exportado, metadados, itens e faixa inferior; número do pedido preservado na referência da transação. |

## Diferenças intencionais que permanecem

- Os dados do aplicativo são dinâmicos: quantidade no carrinho, total, estoque, identificação, sessão e carteiras refletem o estado real da demonstração. Não foram substituídos pelos números fixos do mockup.
- A compra continua exigindo conexão simulada e revisão explícita. Por isso há controles de conexão e “Revisar compra” adicionais à composição estática do Figma.
- Mensagens de erro, processamento, recuperação de pedido e informações de transação simulada continuam disponíveis.
- Login e carteiras desktop não possuem todos os contextos detalhados acessíveis; a exportação geral permite revisar composição, mas não certificar cada medida pequena.
- Alguns contextos exportados contêm dimensões que provocam overflow de texto. Nesses casos, o conteúdo foi mantido legível em vez de reproduzir sobreposições.

## Conferência local

As capturas selecionadas estão em `reports/design-review`. Na etapa inicial, os ajustes foram mantidos locais para revisão do usuário. A autorização posterior incluiu correções de requisitos, nova validação e envio ao GitHub; o fechamento atual está em [VALIDATION.md](VALIDATION.md).

A galeria pode ser aberta em [reports/design-review/index.html](../reports/design-review/index.html). São 20 capturas atuais e quatro comparações com a versão anterior. As capturas atuais usam o build de produção; avisos temporários foram fechados pelo controle da própria interface para a conferência visual. Medidas coletadas do DOM estão em `reports/design-review/geometry.json`.

## Validação histórica da primeira etapa de ajustes

- TypeScript, ESLint, build e `git diff --check`: aprovados.
- Fluxos de produção: 40 testes aprovados, incluindo filtros, compra, recuperação de pedido, autenticação, perfil, carteiras e integridade dos assets.
- Após os ajustes finais de CSS: quatro verificações visuais/overflow aprovadas novamente; capturas desktop atualizadas após o último ajuste de intervalo dos preços.
- Os avisos de compatibilidade futura do carregador de configuração do Vite já existiam e não impedem o build.
- O ponto de partida da revisão foi `e02c2ec389d0be96347ece497ea5db9da168d087`. O envio posterior ao GitHub foi autorizado pelo usuário.

Na etapa de preparação para deploy foram incluídos seleção explícita de rede, seção expansível de dados do colecionador no mobile e erros associados aos campos. Esses controles complementam os estados do layout para cumprir os comportamentos exigidos pelo desafio. A galeria foi atualizada com o build dessa etapa.

A situação atual dos testes e da entrega está em [VALIDATION.md](VALIDATION.md); os números acima registram somente a primeira etapa visual.
