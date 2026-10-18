# Fonte local

Uso o arquivo latino variável de `@fontsource-variable/roboto-mono` 5.3.0, com pesos 100–700 e licença SIL OFL preservada em `public/fonts/LICENSE.txt`.

O arquivo original define `nonbreakingspace` (U+00A0, glifo 225) como um composto de `space` (glifo 1), que não tem contornos. Essa referência gera o aviso `glyf: empty gid 1 used as component in glyph 225` no sanitizador OpenType usado pelo Firefox. O [código do sanitizador](https://github.com/khaledhosny/ots/blob/main/src/glyf.cc) identifica esse caso como warning.

Normalizei U+00A0 como um glifo simples sem contornos, mantendo seu mapeamento Unicode, avanço e demais métricas. Os contornos e métricas de todos os glifos foram comparados ao original nos pesos 100, 400, 500 e 700. A aparência da fonte e a semântica do espaço não separável permanecem iguais.

O arquivo corrigido já está versionado; executar ou compilar a aplicação continua exigindo somente Node/npm. Para regenerar a fonte a partir do pacote instalado:

```sh
npm ci
uv run scripts/prepare-font.py
```

O script declara versões fixas das ferramentas em seu cabeçalho. `uv`/Python são necessários apenas nessa regeneração opcional. O script de imagens `optimize-assets.mjs` preserva a fonte normalizada.
