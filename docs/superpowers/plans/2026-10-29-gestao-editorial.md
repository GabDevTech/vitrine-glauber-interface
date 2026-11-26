# Gestão editorial Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement task-by-task.

**Goal:** Corrigir usabilidade da gestão e adicionar fotografias com revisão obrigatória.
**Architecture:** Serviço IndexedDB isolado; store aplica fluxo editorial; editor protege rascunho e usa componente de imagens. Layout/tabelas compartilham dados enriquecidos.
**Tech Stack:** Vue 3, Quasar, Pinia, Vite, IndexedDB, Playwright.
**Spec:** docs/superpowers/specs/2026-10-29-gestao-editorial-design.md

## Global Constraints
- Preservar alterações preexistentes e identidade atual; sem publicar, commit ou infraestrutura externa.
- Persistência local explícita, sem alegar upload online.
- Produto até 5 fotos; responsável 1 foto opcional; JPEG/PNG/WebP até 8 MB.
- Publicação somente após aprovação; editar invalida aprovação.

## Review Focus
- Arquivo disfarçado/corrompido, limite da galeria e troca rápida de arquivo.
- Erro de armazenamento conserva rascunho e não anuncia sucesso.
- Alterações de imagem e cancelamento não mudam registro original.
- Estado publicado não pode ser escolhido por campo do formulário.
- Mobile sem sobreposição; conteúdo e controles acessíveis.

## Tasks
- [x] Dados: enriquecimento, transições, IndexedDB e testes significativos. Interfaces save(input,{intent:'draft'|'review'}), approve(record), publish(record) assíncronas; photos: string[], ownerPhoto: string; image é capa. records sempre enriquecidos para UI.
- [x] Editor: guard de descarte/saída, botões explícitos, fotos com prévia/validação, mensagens de persistência local. Serviço de mídia exporta prepareImage(file): Promise<string>.
- [x] Interface: fila primeiro, indicadores compactos, preços, categorias, filtro por box e nomes acessíveis das ações.
- [x] Verificar: unitários, build, testes de integração e inspeção desktop/mobile; revisar implementação final.

## Progress
Ruling: autorização do usuário cobre a implementação das sugestões já apresentadas; sem nova aprovação de escopo.
Ruling: trabalho no checkout atual preserva os muitos arquivos preexistentes e mantém o servidor do usuário atualizando; não criar worktree nem commits automáticos.

## Resultado
24 testes unitários aprovados (9 público + 15 gestão). 32 cenários de interface aprovados ao longo da execução: fluxo editorial/fotos, falhas de arquivo/armazenamento, persistência, filtros, acessibilidade, navegação, dark mode e larguras 320–1440. Três falhas iniciais eram seletores da tela anterior durante transição ou filtro Status fora do diálogo; corrigidos e reexecutados. Build gestão aprovado. Inspeção IAB desktop e 390 px concluída sem cadastros de teste no navegador do usuário.

Revisão independente identificou concorrência entre abas; corrigida por comparação atômica de revision em IndexedDB e teste com duas stores. Revisor confirmou delta e testes. E2E executados contra build com interceptação local de assets, pois sockets do processo shell são restritos; teste específico de interceptação de módulo Vite de falha de carregamento não faz parte desse conjunto de produção. Nenhuma API, upload online ou alteração na vitrine pública foi realizada.
