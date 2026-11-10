# Validação da reconstrução

Verificação realizada em 29/10/2026 sobre a implementação local.

| Verificação               | Evidência                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Regras do catálogo        | `npm test`: 9 testes passaram                                                              |
| Jornada no navegador      | `npm run test:e2e`: 23 testes passaram em Chromium                                         |
| Responsividade            | Rotas verificadas em 360, 390, 768 e 1440 pixels sem erro JavaScript ou rolagem horizontal |
| Acessibilidade automática | axe sobre início, catálogo de boxes, detalhe de produto e início em tema escuro            |
| Imagens                   | Capturas verificadas sem imagem quebrada; proporções corrigidas                            |
| Revisão visual            | Início desktop/mobile, catálogo desktop, detalhe mobile e início escuro                    |

## Comportamentos exercitados

- Busca sem distinção de acentos; busca pelo produto encontra o box que o vende.
- Categorias, busca e ordenação; filtros restaurados ao atualizar o endereço.
- Favoritos guardados no navegador, recuperados e removidos.
- Mensagem para busca vazia e recuperação ao limpar filtros.
- Falha simulada no carregamento e recuperação pelo botão de tentar novamente.
- Preferências de tema, texto e contraste com persistência e restauração.
- Link de teclado para pular ao conteúdo.
- Contato demonstrativo apresenta aviso e não abre conversa.
- Navegação pelas páginas públicas e página inexistente.

## Correções da revisão visual

O revisor marcou como resolvidos: proporção das imagens, repetição excessiva de imagens, símbolo negativo cortado, contraste da legenda do início escuro e contraste dos ícones de favoritos. O parecer final foi **Ship** no escopo visual capturado. As evidências ficam em `.impeccable/review/` e são reproduzíveis com `node scripts/capture.mjs` enquanto o servidor local estiver ativo.

## Limites da evidência

Os testes automatizados usam Chromium; não substituem validação manual com todas as tecnologias assistivas ou navegadores. A leitura por voz depende das vozes do dispositivo e não foi avaliada por audição. O mapa e as rotas dependem do serviço externo do Google. O detector da Impeccable não executou neste Windows; a revisão de código e capturas foi realizada separadamente.

Esta entrega continua sendo um catálogo demonstrativo, sem API, cadastro ou pagamentos. Os contatos reais só devem ser habilitados após revisão dos dados.

## Refinamento visual e animações

A rodada de refinamento validou 23 testes de navegador, incluindo abertura finita da fotografia, movimento reduzido pelo sistema e pelo site, filtros sem remontagem, menu mobile com Escape e devolução de foco, e entrelinha proporcional dos títulos. A suíte de regras do catálogo continua com 9 testes. Foram capturadas 12 combinações de página, tamanho e tema em `.impeccable/review/visual-polish/`, sem rolagem horizontal ou imagens quebradas. Os movimentos estão separados em `src/styles/motion.css` e documentados no guia Vue.
