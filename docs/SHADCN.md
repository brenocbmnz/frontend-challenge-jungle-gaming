# Componentes oficiais do shadcn/ui

Importei Button e Dialog com o CLI oficial do shadcn/ui, usando a configuração `new-york` de `components.json`:

```sh
npx --yes shadcn@4.22.0 add button dialog --overwrite --yes
```

O comando foi executado no projeto e atualizou `src/components/ui/button.tsx` e `src/components/ui/dialog.tsx`. Em seguida, adaptei o tema para manter a composição do Figma. Executar novamente com `--overwrite` substitui essas adaptações; revise o diff antes de aceitar uma atualização.

## Origem e conferência

- [Button no registry oficial](https://ui.shadcn.com/r/styles/new-york-v4/button.json)
- [Dialog no registry oficial](https://ui.shadcn.com/r/styles/new-york-v4/dialog.json)
- Cópias dos dois arquivos imediatamente após a execução do CLI, antes das adaptações: `design/reference/shadcn/button.tsx.txt` e `dialog.tsx.txt`.
- Comando, versão, URLs e SHA-256 das cópias originais: `design/reference/shadcn/provenance.json`.
- Licença MIT do projeto de origem: `design/reference/shadcn/LICENSE`.

As cópias de referência documentam a origem; os componentes usados pela aplicação estão em `src/components/ui/`.

## Adaptações feitas

Preservei a estrutura e a API dos componentes importados: Button com CVA, `asChild`, variantes, tamanhos, propriedades de botão e atributos `data-slot`/`data-variant`/`data-size`; Dialog com Root, Trigger, Portal, Overlay, Content, Close, Header, Footer, Title e Description.

Personalizei cores, tipografia, dimensões, foco e ícones para conservar o visual do projeto. Button mantém as dimensões das variantes já usadas nas páginas; as variantes e tamanhos adicionais do componente oficial também permanecem disponíveis. Dialog reutiliza as classes de tema `dialog-overlay`, `dialog-content` e `dialog-close`, e os textos de fechamento foram traduzidos para português.

Ajustei os imports de `cn` para o utilitário local e usei os pacotes individuais `@radix-ui/react-slot` e `@radix-ui/react-dialog` já presentes no projeto. Isso permite conservar o merge de classes e as versões das primitivas existentes. Os imports de React usados apenas para tipos foram marcados como `import type`, conforme o TypeScript do projeto. Os pacotes agregados `cn` e `radix-ui` adicionados pelo CLI foram removidos depois dessas adaptações; `package.json` e o lockfile permaneceram iguais aos anteriores.

## Integração com a aplicação

As páginas usam diretamente o Button importado. Para os diálogos, mantive um adaptador em `src/components/dialog.tsx` e `src/components/dialog-content.tsx`: ele carrega os componentes oficiais sob demanda e devolve o foco ao elemento que abriu o diálogo. Busca, filtros, revisão da compra, imagens ampliadas, carteiras e avisos usam essa integração.

O adaptador não implementa outro diálogo com primitivas Radix: ele compõe os componentes de `src/components/ui/dialog.tsx`. Comportamentos de Escape, foco e modal continuam passando por eles.

A validação desta migração está em [VALIDATION.md](VALIDATION.md). As mudanças estão locais, aguardando revisão antes de qualquer envio ao GitHub.
