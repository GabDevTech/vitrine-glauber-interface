# Especificação de marca — Vitrine Glauber

## Autoridade

A direção atual foi aprovada explicitamente em 29/10/2026 e verificada no [Figma oficial](https://www.figma.com/design/0g8UyUy7EXtzs0sLhXhoNd?node-id=5-16), arquivo `0g8UyUy7EXtzs0sLhXhoNd`, prancha `1:2`, assinatura `5:16`.

Este registro substitui a especificação anterior, que descrevia uma paleta escura e Liberation Sans. Os arquivos históricos estão em `docs/archive`; não são a referência visual desta reconstrução.

## Paleta oficial

| Cor         | Valor     | Uso                                 |
| ----------- | --------- | ----------------------------------- |
| Azul royal  | `#1746C8` | Marca e ações principais            |
| Rosa        | `#EC4899` | Expressão da marca e detalhes       |
| Amarelo     | `#FFD43B` | Expressão da marca e destaques      |
| Azul escuro | `#142D59` | Texto e estrutura no tema claro     |
| Branco      | `#FFFFFF` | Superfícies e contraste sobre royal |
| Cinza claro | `#F5F7FA` | Fundo                               |

Os tokens de aplicação ficam em `src/styles/tokens.css`; a configuração Quasar fica em `src/config/brand.js`. `--brand-blue` permanece royal; `--blue` adapta links e foco ao tema escuro e alto contraste. Consulte [DESIGN.md](DESIGN.md) para usos e valores de interface.

## Tipografia

Outfit nos títulos e na assinatura textual; Inter na leitura e nos controles. Arquivos locais em `public/fonts`, pesos 400, 500, 600 e 700, registrados em `src/styles/fonts.css`. Licenças OFL acompanham os arquivos.

## Símbolos oficiais

- `public/brand/symbol-color.svg`: versão colorida, origem Figma `root430`.
- `public/brand/symbol-negative.svg`: versão negativa, origem `root290`.
- `public/brand/symbol-blue.svg`: versão azul, origem `root320`.

Os símbolos foram baixados do Figma e não redesenhados. `BrandLogo.vue` reúne símbolo e assinatura textual na interface. Logos antigos foram arquivados. Não use os SVGs históricos como substitutos dos símbolos atuais.

## Imagens

Todas as fotos do catálogo são ilustrativas. Nunca atribua uma foto de banco de imagens a uma pessoa ou produto real do catálogo demonstrativo. Fontes, arquivos de origem e derivados estão documentados em [docs/ASSETS.md](docs/ASSETS.md).
