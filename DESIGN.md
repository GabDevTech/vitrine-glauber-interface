---
name: Vitrine Glauber
description: Descoberta cultural com identidade oficial e leitura acolhedora.
colors:
  brand-blue: '#1746C8'
  navy: '#142D59'
  pink: '#EC4899'
  yellow: '#FFD43B'
  paper: '#F5F7FA'
  surface: '#FFFFFF'
  soft: '#F0F3F8'
  blue-soft: '#EAF0FF'
  muted: '#53627A'
  line: '#DCE2EB'
typography:
  display:
    fontFamily: 'Outfit, sans-serif'
    fontSize: 'clamp(36px, 4.4vw, 56px)'
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: '-0.025em'
  headline:
    fontFamily: 'Outfit, sans-serif'
    fontSize: '2.125rem'
    fontWeight: 500
    lineHeight: 1.2
  body:
    fontFamily: 'Inter, sans-serif'
    fontSize: '1rem'
    lineHeight: 1.6
  label:
    fontFamily: 'Inter, sans-serif'
    fontSize: '0.8125rem'
    fontWeight: 500
rounded:
  control: '9px'
  product-image: '16px'
  box-card: '18px'
  detail-image: '18px'
  chip: '24px'
spacing:
  small: '8px'
  medium: '16px'
  grid: '24px'
  section: 'clamp(1.5rem, 3vw, 2.25rem)'
components:
  button-primary:
    backgroundColor: '{colors.brand-blue}'
    textColor: '{colors.surface}'
    rounded: '{rounded.control}'
    padding: '10px 20px'
  button-outline:
    textColor: '{colors.brand-blue}'
    rounded: '{rounded.control}'
    padding: '10px 20px'
  input-search:
    rounded: '{rounded.control}'
  chip-category:
    backgroundColor: '{colors.brand-blue}'
    textColor: '{colors.surface}'
    rounded: '{rounded.chip}'
  box-card:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.box-card}'
  product-card:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.box-card}'
    padding: '8px'
---

# Design System: Vitrine Glauber

## Overview

**Creative North Star: "Descubra antes, visite de verdade"**

A identidade oficial do Figma organiza uma vitrine cultural clara, com fotografias amplas, títulos expressivos e ações fáceis de reconhecer. A interface aproxima visitantes dos expositores e ajuda a preparar uma visita presencial.

O espaço entre blocos dá destaque aos produtos e às histórias. Azul royal conduz as ações; rosa e amarelo acompanham a marca e as categorias. A direção foi explicitamente aprovada em 29/10/2026; este documento registra a implementação, sem propor uma nova identidade.

**Key Characteristics:**

- Identidade oficial preservada.
- Conteúdo local em primeiro plano.
- Leitura clara em telas pequenas e grandes.
- Ações acessíveis por teclado.

## Colors

### Primary

O azul royal `brand-blue` identifica ações preenchidas e permanece estável nos temas. O azul escuro `navy` estrutura a marca e a leitura no tema claro.

### Secondary

Rosa `pink` e amarelo `yellow` expressam a identidade em detalhes e categorias. Não são cores genéricas para todo texto pequeno ou para avisos de erro.

### Neutral

`paper` é o fundo; `surface`, a superfície dos cards; `soft` e `blue-soft`, áreas de apoio; `muted`, texto secundário; `line`, bordas e separadores. Os valores do frontmatter descrevem o tema claro. As substituições de tema escuro e alto contraste estão em `src/styles/tokens.css`.

**The Adaptive Link Rule.** Use `--blue` para links e foco, pois ele se adapta ao tema; use `--brand-blue` para o azul royal de superfícies preenchidas. Não troque um pelo outro sem conferir contraste nos dois temas.

## Typography

Outfit dá forma aos títulos e à assinatura textual; Inter sustenta leitura, rótulos e valores. Ambas são servidas localmente com pesos de 400 a 700 e fallback `sans-serif`.

O papel `display` registra títulos de introdução do catálogo; outras páginas ajustam o tamanho conforme o espaço. Títulos de seção seguem `headline`; cards têm títulos menores. Textos introdutórios usam largura limitada, como 62 caracteres, para facilitar a leitura. A regra compartilhada de `h2` e `h3` usa entrelinha 1.2; componentes podem ajustar essa medida conforme seu conteúdo. Metadados e legendas partem de 12px (0.75rem). Preserve a hierarquia sem usar apenas cor para distinguir importância.

## Layout

O conteúdo tem largura máxima de 1200px. As margens laterais passam de 48px a 32px e depois 20px; em telas de até 360px, ficam em 16px. A grade ampla tem três boxes ou quatro produtos, com intervalo de 24px. Abaixo de 900px, as grades têm duas colunas. Abaixo de 760px, boxes e detalhes usam uma coluna; produtos mantêm duas até 360px, quando passam a uma.

O espaçamento compartilhado entre seções usa `--space-section: clamp(1.5rem, 3vw, 2.25rem)`; no layout mobile, `.section-space` usa 30px. O cabeçalho tem uma única barra, com altura mínima de 76px no desktop e 72px no mobile; a faixa superior de localização foi removida. O cabeçalho e a navegação mobile são responsabilidade do layout. Controles preservam alvos de pelo menos 44px; textos maiores e traduções não devem ser cortados para manter uma composição fixa.

## Elevation & Depth

Cards de catálogo têm superfície e borda, sem sombra permanente. Em dispositivos com mouse preciso, a interação acrescenta `--shadow-card` e destaca a borda; o foco dentro do card também destaca a borda. A sombra de card é `0 12px 32px rgb(20 45 89 / 8%)` no claro e `0 12px 32px rgb(0 0 0 / 20%)` no escuro. A legenda sobreposta do início e o menu mobile usam `--shadow-overlay`: `0 16px 48px rgb(20 45 89 / 15%)` no claro e `0 16px 48px rgb(0 0 0 / 32%)` no escuro. Estados de foco têm contorno visível de 3px.

Os tempos compartilhados ficam em `tokens.css`: `--motion-fast: 140ms`, `--motion-ui: 260ms`, `--motion-view: 220ms` e `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`. `src/styles/motion.css` reúne transições e keyframes, importados por `app.css`. Controles respondem ao pressionar; links e imagens têm movimentos curtos de interação. A abertura da fotografia do início dura 780ms; sua legenda entra em 560ms, com atraso de 100ms. A confirmação de favorito dura 280ms. São efeitos finitos, sem loops, dependências extras ou observadores de rolagem.

A troca de página usa `Transition` com opacidade e chave `route.path`, para atualizar filtros na query sem reiniciar a página. O menu mobile tem entrada e saída próprias; Esc fecha o painel e devolve o foco ao botão. A preferência do sistema e a opção de redução de movimento do site removem efeitos espaciais e rolagem suave, mantendo conteúdo e controles disponíveis.

## Shapes

Controles usam `--radius-control: 9px`. Cards de boxes e produtos e fotografias de detalhe usam `--radius-card: 18px`; imagens dentro de cards de produto usam `--radius-image: 16px`. A fotografia principal do início mantém sua janela assimétrica própria. Filtros de categoria têm formato de pílula. Preserve a geometria dos símbolos oficiais; não reconstrua o símbolo com CSS ou caracteres.

## Components

### Buttons

Ação principal preenchida em royal, texto branco, sem capitalização forçada. Ação secundária com contorno ou fundo transparente. Quasar fornece estados de interação; o projeto acrescenta foco visível e resposta ao pressionar. No modo escuro, o fundo principal permanece royal.

### Chips

Filtros de categoria usam botão com contorno quando inativos e preenchimento quando selecionados. `aria-pressed` comunica seleção. Permita quebra de linha entre filtros.

### Cards / Containers

Boxes têm superfície, borda e fotografia horizontal. Cards de produto também têm superfície e borda, com 8px de espaço interno ao redor da imagem; seguem com expositor, nome e preço. O convite de visita na página inicial forma um card navy com botão amarelo e texto branco de apoio. Favoritar é uma ação independente do link de detalhe, sem botão aninhado dentro de link.

### Inputs / Fields

Busca e seleção usam campos Quasar com contorno e rótulo. O foco envolve o controle. A contagem de resultados tem anúncio de estado; ausência de resultados oferece recuperação, não uma área silenciosamente vazia.

### Navigation

Links internos usam Vue Router. Cabeçalho e navegação mobile mantêm caminhos principais reconhecíveis. O link para pular ao conteúdo aparece ao receber foco. Fotografias têm descrição alternativa e links apenas com ícone recebem rótulo acessível.

## Do's and Don'ts

### Do:

- **Do** usar os símbolos oficiais e fontes locais.
- **Do** conferir foco, contraste e quebra de linha em ambos os temas.
- **Do** identificar fotografias e conteúdo demonstrativos.

### Don't:

- **Don't** reutilizar a paleta e a tipografia antigas como autoridade atual.
- **Don't** substituir botões de favorito por links sem estado acessível.
- **Don't** apresentar fotografias ilustrativas como registro dos expositores reais.
