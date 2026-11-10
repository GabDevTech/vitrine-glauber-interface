# Especificação das direções visuais

## Produto e objetivo

A Vitrine Glauber é a interface pública de descoberta dos boxes, produtos e empreendedores do Centro Cultural Glauber Rocha, em Vitória da Conquista. O produto não é um e-commerce e não deve sugerir checkout, intermediação de pagamento ou entrega centralizada. Sua função é permitir que moradores, visitantes e turistas encontrem o que existe no espaço, conheçam quem produz e iniciem contato direto com o expositor ou planejem uma visita presencial. A refatoração deve preservar todas as rotas e recursos públicos já implementados, mudando a expressão visual e os padrões de interação para a identidade recuperada do chat compartilhado.

## Público e contexto de uso

O público é diverso em idade, repertório digital e condições de acesso. A experiência deve funcionar primeiro no celular, frequentemente em conexões móveis e em situações de consulta rápida. No desktop, deve manter clareza institucional sem parecer um painel administrativo. A interface precisa comunicar legitimidade pública, proximidade cultural e facilidade. A emoção desejada é confiança acolhedora: o visitante deve sentir que o catálogo pertence ao lugar e às pessoas, mas que foi construído com cuidado contemporâneo.

## Identidade obrigatória

A marca recuperada possui um portal em forma de V, criado com azul royal `#2455C7`, dois pontos de cor em amarelo `#FFD449` e rosa `#E84D93`, acompanhado pela assinatura em azul-marinho `#182643`. O ativo oficial usado nas três direções é `public/brand/logo-vitrine-glauber.svg`; o ícone compacto é `public/brand/icone-vitrine.svg`. O azul é a cor de ação e estrutura. Amarelo e rosa são focos breves, nunca uma competição de acentos. A logo não deve ser redesenhada, distorcida ou reconstruída com CSS.

## Conteúdo e arquitetura da home

A home apresenta a proposta em uma frase curta, oferece busca, expõe categorias, mostra uma seleção de boxes e conduz ao catálogo completo. O primeiro viewport deve conter marca, valor, imagem real ou demonstrativa do acervo e uma ação clara. Os cards devem mostrar imagem, categoria, nome, descrição curta e acesso à vitrine. A quantidade de resultados é informativa, não decorativa. Nenhum dado novo deve ser inventado. Fotos e números atuais permanecem demonstrativos.

## Acessibilidade e interação

Texto normal deve manter contraste WCAG AA, alvos de toque devem ter pelo menos 44 pixels e o foco de teclado precisa ser inequívoco. A preferência de redução de movimento deve remover deslocamentos e preservar feedback por cor ou opacidade. A influência Apple entra como comportamento, não como imitação cosmética: resposta imediata ao toque, botões com compressão sutil, materiais translúcidos apenas em camadas flutuantes, consistência espacial e movimento sempre motivado por estado ou hierarquia. Não haverá parallax, rolagem sequestrada, brilho neon ou animações repetitivas.

## Três interpretações

1. Portal Modular: uma leitura gráfica, colorida e assimétrica da marca, inspirada na lógica Memphis sorteada pela Huashu, mas disciplinada para um serviço público. O V e as barras de cor viram estrutura modular.
2. Civic Glass: a interpretação mais próxima dos princípios Apple, com superfícies profundas, navegação translúcida, imagens amplas e hierarquia silenciosa.
3. Guia Cultural: uma interpretação editorial clara, com muito espaço, tipografia forte, sequência de leitura direta e cor aplicada como sinalização cultural.

## Perguntas de forma

- Papel narrativo: a home é apresentação e porta de entrada para descoberta.
- Distância: 10 cm no celular e 1 m em notebook.
- Temperatura: acolhedora, confiante e cívica.
- Capacidade: um hero curto, busca, quatro categorias e três boxes visíveis como amostra.
- Motivo visual: o portal em V, interpretado como entrada, caminho e enquadramento para a produção local.

