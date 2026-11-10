---
name: Gestão da Vitrine Glauber
description: Painel editorial demonstrativo com a identidade da vitrine.
colors:
  primary: '#1746c8'
  navy: '#142d59'
  yellow: '#ffd43b'
  paper: '#f5f7fa'
  surface: '#ffffff'
  soft: '#f0f3f8'
  blue-soft: '#eaf0ff'
  text: '#142d59'
  muted: '#53627a'
  line: '#dce2eb'
  review-bg: '#fff3cd'
  review-text: '#705000'
  published-bg: '#e1f2e8'
  published-text: '#206244'
typography:
  display:
    fontFamily: 'Outfit, sans-serif'
    fontSize: '2.125rem'
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: '-.025em'
  headline:
    fontFamily: 'Inter, sans-serif'
    fontSize: '1.875rem'
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: '-.035em'
  title:
    fontFamily: 'Inter, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: '-.015em'
  body:
    fontFamily: 'Inter, sans-serif'
    fontSize: '14px'
    lineHeight: 1.6
  label:
    fontFamily: 'Inter, sans-serif'
    fontSize: '.8125rem'
    fontWeight: 500
rounded:
  control: '9px'
  panel: '14px'
  editor: '16px'
  login: '20px'
  badge: '99px'
spacing:
  small: '8px'
  field-gap: '14px'
  medium: '16px'
  panel: '24px'
  page-top: '28px'
  page-inline: '32px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.surface}'
    typography: '{typography.label}'
    rounded: '{rounded.control}'
    padding: '8px 16px'
  button-flat:
    textColor: '{colors.primary}'
    typography: '{typography.label}'
    rounded: '{rounded.control}'
    padding: '8px 16px'
  input:
    textColor: '{colors.text}'
    rounded: '{rounded.control}'
  navigation-active:
    backgroundColor: '{colors.blue-soft}'
    textColor: '{colors.primary}'
    rounded: '{rounded.control}'
    padding: '12px 15px'
  status-review:
    backgroundColor: '{colors.review-bg}'
    textColor: '{colors.review-text}'
    rounded: '{rounded.badge}'
    padding: '5px 9px'
  panel:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    rounded: '{rounded.panel}'
---

# Design System: Gestão da Vitrine Glauber

## Overview

**Creative North Star: "Mesa editorial da Vitrine"**

A gestão apresenta o catálogo com superfícies claras, azul de marca e hierarquia compacta. A direção descrita aqui é uma leitura do código existente: organiza o trabalho editorial com a mesma identidade visual da vitrine.

Os avisos de demonstração fazem parte da composição e acompanham ações de salvamento e publicação. O tema escuro usa os tokens compartilhados da marca, preservando a distinção entre fundo, superfície, texto e foco.

**Key Characteristics:**

- Hierarquia compacta com títulos claros e texto auxiliar discreto.
- Superfícies delimitadas por borda e cantos suaves.
- Azul para ações, navegação selecionada e foco.
- Estados editoriais identificados por texto e cor.

## Colors

A paleta normativa acima corresponde ao tema claro. Sua origem é `src/styles/tokens.css`; os estados editoriais são definidos em `gestao/src/styles/catalog.css`.

### Primary

O azul da vitrine identifica ações principais, links e foco. O azul suave marca itens ativos e estados prontos para publicar. A variável `--blue` muda no tema escuro; a cor de fundo do botão principal permanece ligada à marca Quasar.

### Neutral

O azul marinho dá identidade aos textos e à ilustração tipográfica da entrada. Papel, superfície e fundo suave separam áreas por tom. Texto secundário e linha mantêm rótulos auxiliares e limites visíveis. Amarelo é usado na seleção de texto.

Os estados de revisão usam fundo amarelo suave e texto ocre; publicado usa fundo verde suave e texto verde. Rascunho usa os neutros. Consulte a extensão do sidecar para os valores do tema escuro.

**The Texto do Estado Rule.** Todo estado editorial conserva um rótulo legível além da cor.

## Typography

Inter é a fonte da interface; Outfit aparece no título da área visual da entrada. As fontes locais são carregadas por `src/styles/fonts.css`. Os papéis e tamanhos extraídos estão no frontmatter.

O título de página reduz para `1.625rem` em telas de até 700px. A entrada usa título próprio de `2rem`, reduzido para `1.75rem` nesse mesmo intervalo. Quantidades usam números tabulares. Textos de apoio da página têm limite de `65ch`, favorecendo a leitura.

## Layout

A página usa largura máxima de `1240px`, margem automática e espaçamento desktop de `32px 40px 56px`. O cabeçalho tem altura mínima de `76px`. A navegação lateral reúne os quatro destinos da gestão.

O resumo tem quatro colunas; abaixo de 1100px passa a duas. A coluna de ajuda desaparece abaixo de 1280px. Até 1023px aparecem menu e navegação inferior, a página reserva espaço para a barra e a entrada vira uma coluna. Até 700px os filtros empilham e a tabela passa a registros em blocos, preservando informação e ações. Até 520px os pares de campos viram uma coluna.

## Elevation & Depth

Painéis e cartões de métricas são planos, delimitados por borda e contraste tonal. A janela de edição usa o comportamento de sobreposição do Quasar. As sombras compartilhadas da vitrine não são aplicadas como decoração dos painéis da gestão.

As transições de rota usam opacidade, com entrada de `160ms` e saída de `100ms`. Botões respondem em `140ms`, com leve redução ao pressionar. A preferência por movimento reduzido encurta transições e animações em `motion.css`.

## Shapes

Controles e navegação compartilham cantos suaves. Painéis, editor e composição da entrada aumentam progressivamente o raio, conforme o frontmatter. As imagens da tabela são quadradas, recortadas com `object-fit: cover` e cantos de `8px`. Os selos editoriais têm forma de cápsula.

## Components

Botões Quasar usam altura mínima de `44px`, texto sem caixa alta forçada e peso médio. O principal é preenchido; ações secundárias são planas. A entrada usa botão com altura mínima de `50px`.

Campos usam contorno e rótulos visíveis. O foco global é um contorno azul de `3px` deslocado `3px`; campos também o recebem quando seus controles internos estão focados. Erros de formulário aparecem em texto e região de alerta.

A navegação usa fundo azul suave em hover e seleção. A tabela associa imagem, nome e contexto, reserva espaço às ações e se reorganiza no celular. O editor compartilhado tem largura de `640px`, limite de `92dvh` e rolagem interna para os campos.

O sidecar `.impeccable/design.json` contém amostras HTML/CSS independentes dos controles existentes para inspeção visual. Os componentes Vue e os estilos da gestão continuam sendo a implementação de referência.

## Do's and Don'ts

### Do:

- **Do** reutilizar os tokens compartilhados de cor e fonte.
- **Do** preservar foco visível, rótulos e áreas de ação com altura mínima de 44px.
- **Do** manter os avisos de demonstração próximos às ações relevantes.
- **Do** adaptar tabelas e filtros à largura disponível.

### Don't:

- **Don't** comunicar estado editorial somente pela cor.
- **Don't** remover a adaptação para movimento reduzido.
- **Don't** aplicar sombras decorativas aos painéis planos existentes.
- **Don't** trocar uma cor global para corrigir apenas um componente da gestão.

## Identidade da gestão e simplificação

A prancha oficial `20:2` do Figma contém a identidade própria da gestão. `ManagementSymbol.vue` compõe as duas camadas SVG originais, sem editar os arquivos, nas proporções da prancha. `ManagementBrand.vue` reúne símbolo e assinatura Outfit e troca a variante no tema escuro.

O painel não repete o título no cabeçalho e não exibe uma faixa de aviso acima do conteúdo. Um único aviso após o conteúdo explica que os dados são temporários. A fila de revisão ocupa a largura disponível, sem a coluna lateral de instruções redundantes.

O login segue a composição da referência Nucleus UI fornecida pelo usuário: painel fotográfico com marca e texto à esquerda, formulário compacto e centralizado à direita. Usa a imagem ilustrativa cultural já disponível no projeto, a identidade própria da gestão e ações azuis. O formulário tem e-mail, senha, controle de visibilidade, validação. No celular, o painel fotográfico sai de cena e a marca aparece acima do formulário. A imagem tem uma aproximação finita de 800ms e o formulário uma entrada de 480ms; ambos respeitam movimento reduzido. Nenhuma animação bloqueia a interação.

## Referência do painel e acesso de teste

O modelo Sass Admin enviado pelo usuário orienta a composição: navegação lateral, resumo no topo, coluna principal com revisões e catálogo, e apoio lateral com situação das publicações e criação de cadastros. A paleta e os símbolos continuam sendo os da Vitrine Glauber. Os indicadores usam os registros disponíveis, sem dados de vendas ou gráficos fictícios.

Abaixo de 701px, as áreas se organizam em uma coluna. Busca e alternância entre boxes e produtos permanecem disponíveis. O editor ocupa a tela inteira, com título e ações separados da região de rolagem. A busca do catálogo mostra até cinco resultados e oferece acesso à lista completa.

Na demonstração, qualquer texto não vazio em Login e Senha permite entrar. Não há conferência de credenciais nem autenticação de servidor. O formulário mantém a validação de campos vazios e a opção de mostrar a senha.
