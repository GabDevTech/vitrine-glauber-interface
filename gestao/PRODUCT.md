# Produto: Gestão da Vitrine Glauber

## Propósito

Demonstrar uma rotina editorial simples para organizar os boxes e os produtos da Vitrine Glauber. A interface deve ser compreensível para quem usa o painel e para quem está começando a estudar seu código.

## Fluxos existentes

| Área                  | O que permite fazer                                                 |
| --------------------- | ------------------------------------------------------------------- |
| Entrada demonstrativa | Preencher e-mail e senha de exemplo e abrir uma sessão de navegação |
| Visão geral           | Consultar quantidades derivadas dos cadastros e uma fila editorial  |
| Boxes                 | Buscar, filtrar, criar e editar os campos básicos de um box         |
| Produtos              | Buscar, filtrar, criar e editar um produto vinculado a um box       |
| Revisões              | Trabalhar com cadastros ainda não publicados                        |
| Preferências e saída  | Alternar o tema e encerrar a demonstração                           |

Os estados editoriais são `rascunho`, `em-revisao`, `pronto` e `publicado`. Os rótulos visíveis são definidos em `gestao/src/config/statuses.js`. A ação de publicar na fila muda um cadastro pronto para publicado somente na demonstração.

## Dados e limites

O serviço `gestao/src/services/catalogService.js` cria uma cópia do catálogo da vitrine, associa os estados de exemplo de `gestao/src/data/editorialStatus.js` e entrega os registros à store da gestão. Os totais e a fila usam esses mesmos registros; não são indicadores de vendas, visitas ou desempenho.

As edições vivem na memória e são descartadas ao recarregar ou sair. Não há API, POST, banco de dados ou publicação na vitrine. O sinal de sessão em `sessionStorage` não verifica identidade e não protege dados. A preferência de tema pode permanecer salva no navegador, independentemente dos cadastros temporários.

O escopo atual não inclui usuários, permissões, relatórios, gráficos, uploads ou exclusão de registros. Autenticação e persistência reais exigem um projeto próprio de servidor, contratos, validação e autorização antes de usar dados reais.

## Diretrizes de manutenção

- Manter a identidade visual da vitrine e os avisos claros sobre o modo demonstrativo.
- Preferir componentes compartilhados e regras pequenas, com nomes que expressem sua finalidade.
- Preservar a separação entre o estado da gestão e o estado da vitrine pública.
- Evitar novas funcionalidades ao reorganizar código: primeiro manter os fluxos existentes compreensíveis e verificáveis.
