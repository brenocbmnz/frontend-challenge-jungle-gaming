# Organização das branches

Em 18/10/2026, organizei as alterações locais acumuladas após `d0ecf79` em quatro branches. Os sete commits anteriores foram preservados. Esta é uma separação retrospectiva por responsabilidade; não recriei datas ou uma sequência de desenvolvimento que não foi registrada.

| Branch | Conteúdo |
| --- | --- |
| `refactor/shadcn-components` | Button e Dialog oficiais, adaptadores, imports, licença e procedência |
| `fix/catalog-checkout-mobile` | Cards e banner, filtros, raridade, favoritos, paginação responsiva, controles de compra, recibo e eventos de estoque |
| `feat/account-navigation-profile` | Avatar, menus sobrepostos, títulos mobile, carteira, rolagem do catálogo e Salvar condicionado às alterações |
| `docs/validation-history` | Documentação atualizada e evidências de validação das etapas |

Criei cada branch a partir da `main` após integrar a anterior, usando merge com `--no-ff`. Isso preserva os limites das entregas no grafo e mantém as dependências na ordem correta. Não usei force push nem reescrevi os commits existentes. As branches ficam disponíveis para consulta após os merges.

Para inspecionar o histórico:

```sh
git fetch origin
git log --graph --oneline --all
```

Para próximas alterações, começo uma branch a partir da `main`, implemento e valido o assunto, e só então integro. Os relatórios históricos documentam o estado testado em cada etapa; a validação mais recente está em [TEST_REPORTS.md](TEST_REPORTS.md).

A correção posterior da fonte usa a branch `fix/font-empty-glyph`, criada a partir da main integrada e incorporada por merge explícito após validação.
