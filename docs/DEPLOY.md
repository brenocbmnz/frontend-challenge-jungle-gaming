# Publicação

Repositório: https://github.com/brenocbmnz/frontend-challenge-jungle-gaming

## Vercel

1. Importe o repositório na sua conta Vercel.
2. Selecione Vite; diretório raiz do repositório.
3. Comando de instalação: `npm ci`. Build: `npm run build`. Saída: `dist`.
4. Selecione Node.js `22.x` nas configurações do projeto. Não são necessárias chaves ou variáveis privadas. Os mocks ficam ativos por padrão; se definir `VITE_ENABLE_MOCKS`, use `true`.
5. Faça deploy da branch `main` após o push desta revisão e teste acesso direto/refresh de `/nft/1`, `/carrinho`, `/login` e `/pagamento` (após autenticar).

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

Após a publicação, copie a URL `https://...vercel.app` para o README e envie o link junto com o repositório. A ausência dessa URL continua sendo a única etapa externa da entrega; a configuração local não substitui o deploy obrigatório.
