# Validação

## Verificações realizadas

- TypeScript, ESLint e build otimizado: aprovados.
- Assets originais: 110 arquivos presentes e não vazios. PNGs preservados e derivações WebP locais.
- Playwright em desenvolvimento: 40 testes aprovados, incluindo os 36 casos funcionais desktop/mobile.
- Após otimizar o preload: quatro verificações visuais e de assets aprovadas novamente.
- Playwright contra o build de produção otimizado: 40 testes aprovados, incluindo os mesmos fluxos, baselines e verificações de assets.
- Oito baselines de início, detalhe, carrinho e pagamento; imagens carregam e não há overflow horizontal em 390, 768 e 1440 px. As baselines acompanham `tests/visual.spec.ts-snapshots/`.

## Lighthouse

Medianas de três medições por página e perfil, com todos os mocks padrão ativos e a mesma entrega otimizada da aplicação:

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO |
| --- | --- | --- | --- | --- | --- |
| inicio | desktop | 100 | 100 | 100 | 100 |
| detalhe | desktop | 100 | 100 | 100 | 100 |
| inicio | mobile | 91 | 100 | 100 | 100 |
| detalhe | mobile | 91 | 100 | 100 | 100 |

Performance atende à meta de 90 nas quatro combinações. CLS mediano zero. Resultados individuais, versões, ambiente e métricas estão em [reports/lighthouse](../reports/lighthouse/README.md). Os testes não desativam funcionalidades para melhorar a medição.

## Limites de verificação e publicação

- O limite do Figma Starter continua bloqueando o login desktop. A fidelidade integral não está certificada; veja [DESIGN_STATUS.md](DESIGN_STATUS.md). As capturas recuperadas das outras três telas foram usadas nos ajustes.
- Configurações e instruções de Vercel/Netlify estão prontas em [DEPLOY.md](DEPLOY.md). Não houve publicação nessas contas, conforme a escolha de preparar o projeto para importação.
- Destino do código: https://github.com/brenocbmnz/frontend-challenge-jungle-gaming.
