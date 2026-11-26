# Vitrine Glauber — reconstrução aprovada

## Objetivo

Facilitar a descoberta dos boxes e produtos do Centro Cultural Glauber Rocha e conduzir o visitante ao contato e à visita presencial. A direção foi aprovada pelo usuário em 29/10/2026.

## Identidade verificada no Figma

Arquivo `0g8UyUy7EXtzs0sLhXhoNd`, prancha `1:2`, assinatura indicada `5:16`. Azul royal #1746C8, rosa #EC4899, amarelo #FFD43B, azul escuro #142D59, branco #FFFFFF e cinza #F5F7FA. Outfit nos títulos e na marca; Inter na leitura. Símbolos oficiais baixados, sem redesenho.

## Experiência

Início com busca e categorias; catálogos com filtros na URL; detalhes de box e produto; favoritos locais para planejar uma visita; orientações para chegar; páginas institucionais. Dados continuam demonstrativos, claramente identificados. Contatos fictícios não devem abrir conversas com terceiros. Não existe pagamento ou checkout.

## Arquitetura didática

Vue 3, JavaScript, Quasar, Pinia e Vue Router. Páginas compõem componentes pequenos. Dados em `data`, carregamento em `services`, catálogo e favoritos em `stores`, comportamentos reutilizáveis em `composables`, funções puras em `utils`. Filtros pertencem à rota, não à store global. CSS global limitado a tokens, base e layouts compartilhados; estilos de componentes ficam próximos do componente.

## Validação

Compilação de produção, testes de busca/categorias/ordenação/favoritos, navegação real, estados vazios, recarregamento de links, teclado e revisão visual desktop/mobile. Documentação em português ensina a alterar dados, componentes e rotas.
