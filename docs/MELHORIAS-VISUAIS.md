# Refinamento visual e movimento

A identidade do Figma e os fluxos públicos permanecem a base desta evolução.

## Direção

Vitrine cultural com fotografias em destaque, texto confortável e ações claras.
Azul royal orienta ações; rosa e amarelo continuam nos detalhes da marca.
As páginas compartilham espaços, cantos, profundidade e tempos de movimento.

## Movimento com propósito

- **Momento principal:** a fotografia inicial se abre como uma janela, em uma única sequência curta.
- **Continuidade:** troca de página por transição de opacidade, sem animar cada mudança de filtro.
- **Resposta:** seleção de favoritos, imagens, categorias e botões reagem à ação da pessoa.
- **Orçamento:** CSS nativo, sem biblioteca adicional, sem animações contínuas ou observadores de rolagem.
- **Acessibilidade:** a preferência do sistema e o controle do site removem movimentos não essenciais.

## Organização

`src/styles/tokens.css` define cores, raios, sombras, espaços e tempos.
`src/styles/motion.css` concentra transições compartilhadas e keyframes.
O estilo específico continua no componente responsável.
A troca de páginas é composta em `MainLayout.vue`; filtros continuam na URL.

## Skills consultadas

Frontend Design, UI UX Pro Max, Taste Skill, Impeccable, Apple Design e Huashu Design.
Vercel Agent Skills contribui por Web Interface Guidelines e princípios de composição aplicáveis a Vue.
Regras exclusivas de React não são transportadas para o projeto Vue.
Não foi localizada uma skill instalada com o nome exato Frontend UI Engineering.

## Verificação

Compilação, regras de catálogo, jornadas no Chromium e contraste automatizado.
Revisão de início, catálogos, detalhes, favoritos, visita e conteúdo institucional em desktop e celular.
A animação também é exercitada com movimento reduzido.
