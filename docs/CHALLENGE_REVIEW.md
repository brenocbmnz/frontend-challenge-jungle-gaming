# Conferência do enunciado — 18/10/2026

Fonte: https://github.com/junglegaming/frontend-challenge (seções 1–12).

Este documento registra a situação atual da entrega. Evidências, comandos e limites estão em [VALIDATION.md](VALIDATION.md) e [TEST_REPORTS.md](TEST_REPORTS.md).

## Requisitos implementados

| Área | Situação |
| --- | --- |
| Stack | React, TypeScript, Router/Query, Axios, REST, Socket.IO, Tailwind, componentes no padrão shadcn/ui sobre Radix, MSW, Playwright e Lighthouse participam da solução |
| Descoberta | Destaques, catálogo, filtros combinados, busca, ordenação e paginação persistidos na URL; valores padrão omitidos |
| Detalhe e favoritos | Acesso direto, galeria, edição, quantidade, indisponibilidade, favoritos persistidos e atualização otimista com rollback |
| Carrinho | Quantidades, remoção, cupons, persistência após refresh/login e valores ETH calculados com BigInt |
| Compra | Dados do colecionador, rede/carteira, conexão simulada, revisão de cotação, pedidos idempotentes, recusa e recuperação após timeout |
| Recibo | Confirmação condicionada ao estado do pedido, snapshot imutável, taxas, total e referência simulada |
| Conta | Cadastro, conflito, login, logout, expiração, retorno ao fluxo anterior, perfil, avatar, senha e carteiras |
| Consistência do e-mail | Cadastro, login e perfil normalizam espaços externos e maiúsculas; conflitos consideram o endereço normalizado; senha preservada exatamente |
| Validação do login | Erros de preenchimento associados aos campos; credenciais preenchidas e incorretas recebem mensagem genérica |
| Tempo real | Cliente Socket.IO interceptado por MSW; versões, duplicatas, eventos antigos, isolamento de sessão e reconciliação REST |
| Cenários | Dois usuários fictícios, falhas reproduzíveis, painel de demonstração e reset |
| Acessibilidade | Foco de diálogos, atalho de conteúdo, erros associados, feedback acessível e reflow de telas privadas |
| Testes | Suíte de produção desktop/mobile e oito baselines versionadas; relatório HTML em reports/playwright |
| Instalação | npm ci, tipos, lint, build e suíte anterior verificados em cópia isolada; verificações posteriores discriminadas em VALIDATION.md |
| Performance | Últimas medianas Lighthouse: desktop 100/100, mobile 92/93 em performance; demais categorias 100; medições anteriores ao ajuste de autenticação |
| Entrega | Repositório público, lockfile, assets locais, mocks, contratos, configurações, documentação e aplicação publicada na Vercel |

## Limites conhecidos

A fidelidade integral ao Figma não está certificada: a cota da integração impediu recuperar todas as referências detalhadas. Assets, capturas disponíveis, ajustes ópticos e desvios estão em [DESIGN_REVIEW.md](DESIGN_REVIEW.md) e [ARCHITECTURE.md](../ARCHITECTURE.md).

A persistência e autenticação são demonstrativas, locais ao navegador. Os mocks não constituem um servidor compartilhado entre abas. SHA-256 evita persistir a senha em claro, mas não representa autenticação de produção. Novos usuários e alterações não são sincronizados entre dispositivos.

Blockchain, extensão real de carteira e gateway real estão fora do escopo. Páginas editoriais, suporte, atividade, ofertas e downloads também não fazem parte da entrega. Login social e recuperação de senha informam a limitação sem aparentar sucesso.

Testes aprovados não certificam todos os estados, navegadores ou equivalência visual com o Figma. As medições Lighthouse documentam o build e as condições em que foram executadas; não foram repetidas após as correções de autenticação.
