# Produto: Gestão da Vitrine Glauber

## Propósito

Demonstrar uma rotina editorial simples para organizar os boxes e os produtos da Vitrine Glauber. A interface deve ser compreensível para quem usa o painel e para quem está começando a estudar seu código.

## Fluxos existentes

| Área                 | O que permite fazer                                                 |
| -------------------- | ------------------------------------------------------------------- |
| Acesso               | Aceitar convite, definir nome de usuário e senha e entrar com a API |
| Visão geral          | Consultar quantidades derivadas dos cadastros e uma fila editorial  |
| Boxes                | Buscar, filtrar, criar e editar os campos básicos de um box         |
| Produtos             | Buscar, filtrar, criar e editar um produto vinculado a um box       |
| Revisões             | Trabalhar com cadastros ainda não publicados                        |
| Categorias           | Criar, editar, ativar, desativar e excluir categorias (`admin`)     |
| Preferências e saída | Alternar o tema e encerrar a sessão autenticada                     |

Os estados editoriais são `rascunho`, `em-revisao`, `pronto`, `publicado` e `inativado`. Os rótulos visíveis são definidos em `gestao/src/config/statuses.js`. A ação de publicar atualiza a vitrine pública e a ação de inativar retira o item do ar sem apagar o histórico.

## Dados e limites

O serviço `gestao/src/services/catalogService.js` cria uma cópia do catálogo da vitrine, associa os estados de exemplo de `gestao/src/data/editorialStatus.js` e entrega os registros à store da gestão. Os totais e a fila usam esses mesmos registros; não são indicadores de vendas, visitas ou desempenho.

As edições são persistidas localmente no IndexedDB deste navegador e continuam disponíveis após recarregar. A autenticação usa a API e uma sessão em cookie HttpOnly; os registros editoriais ainda não são enviados ao servidor nem publicados na vitrine. A preferência de tema e os cadastros locais podem permanecer salvos no navegador.

O escopo atual ainda não inclui administração de usuários e permissões, relatórios, gráficos, uploads editoriais ou persistência editorial na API. As rotas de gerenciamento e a autorização por papel serão implementadas em etapas posteriores.

## Diretrizes de manutenção

- Manter a identidade visual da vitrine e os avisos claros sobre o modo demonstrativo.
- Preferir componentes compartilhados e regras pequenas, com nomes que expressem sua finalidade.
- Preservar a separação entre o estado da gestão e o estado da vitrine pública.
- Evitar novas funcionalidades ao reorganizar código: primeiro manter os fluxos existentes compreensíveis e verificáveis.
