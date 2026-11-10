# Refatoração da gestão Vitrine Glauber

## Origem e escopo

A gestão existente foi localizada no commit `4564b04`, na pasta `gestao/`. A cópia de trabalho está baseada em `94d3b07`; a vitrine pública já recebeu outras alterações e será preservada. O pedido atual autoriza refatorar a gestão e corrigir o código mantendo escopo pequeno.

Continuam: entrada demonstrativa, visão geral, boxes, produtos, revisões, criação/edição básica de cadastro, mudança de status, tema e saída. Não serão criados usuários, permissões, relatórios, gráficos, upload, exclusão, API ou autenticação real.

## Problemas a corrigir

Busca limpa não pode chamar métodos em null. Filtros devem funcionar. Ações não podem informar salvamento sem modificar nada. Contagens devem derivar dos registros, sem números fixos contraditórios. Acesso demonstrativo não deve pedir senhas reais. Rascunhos e edições existem somente na sessão da interface e não alteram a vitrine pública.

## Estrutura

Aplicação Vue e Quasar separada em `gestao/`, reutilizando dependências, marca, fontes e dados de exemplo da raiz. Layout compõe cabeçalho e navegação. Páginas compõem resumo, fila e catálogo. Serviços entregam os registros; store mantém alterações em memória; funções puras validam, filtram e contam. Editor reutilizável tem formulário pequeno. URL mantém busca e filtros. Sessão demonstrativa é um fluxo de navegação, não uma barreira de segurança.

## Visual

Identidade atual do Figma: royal #1746C8, navy #142D59, rosa #EC4899 e amarelo #FFD43B. Interface de operação usa Inter, hierarquia compacta, tabela legível no desktop e linhas reorganizadas no celular. Movimento só explica estados, com suporte à redução de movimento.

## Evidência de conclusão

Testes de validação, busca sem acentos, status e contagens; testes no navegador para entrada, saída, criação, edição, filtros, publicação demonstrativa, teclado e celular. Build separado da gestão; testes públicos preservados. Documentação indica onde alterar cada parte e deixa os limites da demonstração explícitos.
