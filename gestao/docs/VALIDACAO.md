# Validação da gestão

Verificação realizada em 29/10/2026.

| Área                         | Resultado                                                              |
| ---------------------------- | ---------------------------------------------------------------------- |
| Regras da gestão             | 6 testes passaram em `npm run test:gestao:unit`                        |
| Interface da gestão          | 18 testes passaram em `npm run test:gestao:e2e`                        |
| Regressão da vitrine pública | 23 testes de navegador e 9 testes unitários passaram                   |
| Compilação                   | `npm run build:gestao` e `npm run build` passaram                      |
| Layouts                      | Capturas de entrada, resumo, catálogos, revisões, editor e tema escuro |

## Comportamentos verificados

Entrada e saída da demonstração; navegação lateral e mobile; busca sem acentos;
limpeza de campo com valor nulo; filtros restaurados pela URL; criação e edição
temporárias; produto vinculado a box válido; fila e contagens atualizadas a partir
dos mesmos registros; restauração ao recarregar; recuperação de falha no carregamento;
tema escuro persistido; salto de teclado para o conteúdo e nome acessível do diálogo.

Os testes também verificaram ausência de requisições de escrita durante a edição,
ausência de erros JavaScript e ausência de rolagem horizontal em 390, 768 e 1440 px.
O carregamento das imagens foi conferido. As verificações axe passaram nas telas de
entrada, painel e boxes, incluindo o painel escuro.

## Revisão visual e limites

O parecer da revisão manual foi **ship**, sem achados materiais no escopo capturado.
As nove capturas ficam em `.impeccable/review/gestao/` e podem ser reproduzidas com
`node scripts/capture-gestao.mjs` na raiz, com o servidor da gestão ativo.

A revisão e os testes usam Chromium e não substituem avaliação humana com todas as
tecnologias assistivas. O detector automático de design não estava executável neste
Windows; a revisão de código e imagens foi feita separadamente.

Esta entrega não implementa autenticação, persistência em servidor ou publicação real.
O marcador da sessão organiza a navegação e não protege dados. Os registros da gestão
são cópias em memória dos dados demonstrativos.
