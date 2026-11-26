# Refinamento da vitrine e da gestão — 29/10/2026

## Alterações

- Cabeçalho público com uma única barra; localização continua disponível na visita e no rodapé.
- Abertura menor, sem atalhos de categoria e frases de apoio repetidas. Categorias aparecem na seção própria.
- Espaçamento compartilhado de seção entre 24px e 36px; intervalo mobile de 30px preservado.
- Gestão com fila em largura completa e sem coluna lateral de instruções.
- Aviso de dados temporários consolidado após o conteúdo; cartões de resumo sem legendas repetidas.
- Identidade da gestão extraída da prancha 20:2 do Figma, com quatro camadas SVG originais, variantes principal e negativa.
- ManagementSymbol.vue mantém proporções das camadas; tamanho controlado por --management-symbol-size para evitar conflitos entre CSS global e estilos locais.
- Login demonstrativo com uma ação, sem credenciais reais. Apresentação finita, acesso por teclado e preferência de movimento reduzido.

## Verificação

- Vitrine: 23 testes de interface aprovados.
- Gestão: 20 testes de interface aprovados, incluindo os dois novos testes de movimento e acesso por teclado.
- Verificações automáticas de acessibilidade, estados de erro, filtros, edição temporária e tema escuro incluídas nas suítes.
- Inspeção visual em desktop e celular, com confirmação da marca em 200px no pôster e 48px no cabeçalho mobile.
- Sem imagens quebradas ou rolagem horizontal nas capturas verificadas, incluindo gestão em 360px.
- Compilações da vitrine e da gestão concluídas; dados e autenticação continuam demonstrativos.

## Referências

- Figma: https://www.figma.com/design/0g8UyUy7EXtzs0sLhXhoNd?node-id=20-2
- Organização e manutenção: gestao/docs/GUIA-GESTAO.md e docs/GUIA-VUE.md.
- Capturas: .impeccable/review/refinamento/.

As skills disponíveis foram aplicadas à sua área: Taste para a vitrine, orientação de operação do Impeccable para a gestão, Vue/Quasar como base, Vercel Web Interface Guidelines, Apple para movimento e Huashu para continuidade da identidade aprovada. O nome exato Frontend UI Engineering não foi encontrado entre as skills instaladas. O carregador Impeccable e o Python de busca de UI UX Pro Max não executaram neste ambiente; foram usadas as diretrizes locais, o contexto do projeto e a inspeção do resultado.
