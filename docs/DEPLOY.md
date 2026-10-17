# Publicação

Repositório: https://github.com/brenocbmnz/frontend-challenge-jungle-gaming

## Vercel

1. Importe o repositório na sua conta Vercel.
2. Selecione Vite; diretório raiz do repositório.
3. Comando de instalação: `npm ci`. Build: `npm run build`. Saída: `dist`.
4. Use Node.js 22.12 ou superior. Não são necessárias chaves ou variáveis privadas.
5. Publique e teste acesso direto a `/nft/1`, `/carrinho` e `/login`.

O `vercel.json` preserva os arquivos estáticos e os dois service workers, encaminhando as rotas da aplicação para `index.html`.

## Netlify

Importe o mesmo repositório, usando `npm ci`, `npm run build` e publicação de `dist`. O `netlify.toml` define build e saída; `public/_redirects` é copiado para o build e permite navegação direta nas rotas. Use Node.js 22.12 ou superior nas configurações do projeto.

## Verificação após publicar

- HTTPS ativo: o MSW depende do service worker.
- `/mockServiceWorker.js` e `/apiMockServiceWorker.js` devem responder JavaScript, sem redirecionar ao HTML.
- Conta fictícia `nova@kurio.test`, senha `Kurio123!`.
- Carrinho permanece após atualizar. Checkout simulado gera recibo e não movimenta fundos.
- Dados ficam no navegador; não existe backend compartilhado entre visitantes.

Nenhuma publicação foi realizada em uma conta Vercel/Netlify nesta sessão. A URL pública deve ser adicionada ao README após o deploy.
