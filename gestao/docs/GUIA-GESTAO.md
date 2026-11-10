# Guia da gestão para quem está começando

Todos os caminhos deste guia são relativos à raiz do repositório. A pasta `gestao/` contém outra aplicação Vue, com configuração própria do Vite. Ela reutiliza as dependências instaladas na raiz, a identidade visual e os arquivos de `public/`.

## 1. Executar e experimentar

Na raiz, rode `npm ci` e depois `npm run dev:gestao`. Acesse <http://localhost:4175/gestao/login> e entre na demonstração. Consulte a visão geral, filtre boxes ou produtos, abra um cadastro e salve uma mudança. Recarregue para verificar que os cadastros e fotos continuam disponíveis neste navegador.

O formulário não faz login real. Use qualquer login e senha para testar. `gestao/src/stores/session.js` guarda apenas um marcador em `sessionStorage`; a checagem do router controla a experiência de navegação. Qualquer pessoa com acesso ao navegador pode modificar esse estado. Não use a demonstração como proteção de informações.

## 2. Entender como uma tela aparece

1. `gestao/index.html` carrega `gestao/src/main.js`.
2. `main.js` instala Vue, Pinia, Vue Router e Quasar e monta `gestao/src/App.vue`.
3. `App.vue` inicializa o tema e entrega a área da tela ao router.
4. `gestao/src/router/index.js` escolhe a página pelo endereço. A entrada usa `ManagementLoginPage.vue`; as demais páginas ficam dentro de `gestao/src/layouts/ManagementLayout.vue`.
5. O layout reúne navegação, cabeçalho e aviso de demonstração. A página reúne componentes menores, como filtros, tabela e editor.

| Endereço           | Página em `gestao/src/pages/`                     |
| ------------------ | ------------------------------------------------- |
| `/gestao/login`    | `ManagementLoginPage.vue`                         |
| `/gestao/painel`   | `ManagementDashboardPage.vue`                     |
| `/gestao/boxes`    | `ManagementWorkspacePage.vue`, com tipo `box`     |
| `/gestao/produtos` | `ManagementWorkspacePage.vue`, com tipo `product` |
| `/gestao/revisoes` | `ManagementWorkspacePage.vue`, com tipo `review`  |

Uma página é a composição completa. Um componente é uma parte reutilizável. Por exemplo, `gestao/src/components/catalog/RecordTable.vue` mostra registros e avisa quando alguém clica em editar; não precisa conhecer todas as páginas em que aparece.

## 3. Seguir os dados

Para ler um arquivo `.vue`: `<script setup>` contém o JavaScript e `<template>`
contém a interface. `ref` guarda um valor que pode mudar; `computed` calcula um
valor a partir de outros; `watch` reage a uma mudança. No JavaScript uma ref usa
`.value`; no template o Vue faz esse acesso automaticamente.

`defineProps` declara o que um componente recebe. `defineEmits` declara os eventos
que ele envia ao pai. `v-model` liga um campo ao seu valor; `defineModel` declara
esse vínculo em um componente próprio, como a abertura de `RecordEditor`.
Componentes que começam com `q-` pertencem ao Quasar.

O [guia de Vue da vitrine](../../docs/GUIA-VUE.md) traz exemplos dos mesmos conceitos.

`gestao/src/services/catalogService.js` importa boxes, produtos e categorias de `src/data/catalog.js`. Faz uma cópia com `structuredClone`, ajusta os caminhos das imagens e aplica os estados de `gestao/src/data/editorialStatus.js`. Alterar a cópia não modifica o catálogo público.

`gestao/src/stores/catalog.js` guarda essa cópia para os componentes. Uma store é um estado compartilhado: a tabela e os cartões de resumo leem os mesmos registros. Suas ações principais são:

| Ação              | Responsabilidade atual                              |
| ----------------- | --------------------------------------------------- |
| `load()`          | Carregar o catálogo inicial pelo serviço            |
| `save(input)`     | Validar e criar ou atualizar um registro na memória |
| `publish(record)` | Mudar um registro pronto para publicado na memória  |
| `clear()`         | Limpar os dados ao sair                             |

`gestao/src/utils/records.js` reúne funções sem interface: filtrar, validar, gerar um slug único e calcular totais. Slug é o nome simplificado usado como identificador legível, como `cesto-artesanal`.

O cadastro novo começa como rascunho. `gestao/src/config/statuses.js` concentra valor, rótulo e tom visual dos quatro estados. Os estados iniciais de exemplo ficam em `gestao/src/data/editorialStatus.js`, com chaves como `box:1` e `product:2`. Um registro sem estado explícito nessa lista começa publicado.

## 4. Entender o formulário compartilhado

`gestao/src/components/catalog/RecordEditor.vue` controla a janela, cria uma cópia temporária para edição, chama `catalog.save()` e mostra a notificação. Cancelar pede confirmação quando há alterações não salvas. A gravação aguarda o IndexedDB; falhas mantêm o rascunho aberto.

`gestao/src/components/catalog/RecordFields.vue` mostra os campos. Nome, descrição e categoria são comuns; o status é apresentado sem seletor e muda pelas ações editoriais. Produto tem box responsável e preço opcional; box tem responsável e número opcionais.

`gestao/src/composables/useRecordActions.js` reúne a abertura para criar ou editar e a ação de publicar com notificação. Um composable é uma função que reúne comportamento Vue reutilizável. Aqui ele não chama API.

`gestao/src/composables/useWorkspaceFilters.js` lê e atualiza `busca`, `status`, `categoria` e `box` na query do endereço. Por isso os filtros podem ser representados na URL e continuam ao navegar pelo histórico do navegador.

### Exemplo: mudar o texto do campo nome

Abra `gestao/src/components/catalog/RecordFields.vue` e localize o primeiro `q-input`, ligado a `draft.name`. Altere apenas o rótulo desejado na expressão `:label`, por exemplo de `Nome do produto` para `Nome do item`. O dado continua sendo `name`; não é necessário renomear o modelo para mudar um texto visível.

Se a mudança for uma regra, como o tamanho máximo permitido, confira também `validateRecord()` em `gestao/src/utils/records.js` e os limites do campo. A store valida o conteúdo independentemente da aparência do formulário. Rode `npm run test:gestao:unit` e experimente salvar tanto um valor válido quanto um inválido.

Um campo inteiramente novo exige decisões em mais de um ponto: valor inicial no editor, controle em `RecordFields.vue`, validação em `records.js` e cópia do valor em `save()` na store. Adicionar só um input não faz a store guardar o novo valor.

## 5. Encontrar os estilos

`gestao/src/styles/management.css` é um índice de imports. Acrescente a regra no arquivo da responsabilidade correspondente:

| Arquivo em `gestao/src/styles/` | Conteúdo                                            |
| ------------------------------- | --------------------------------------------------- |
| `base.css`                      | Tipografia, foco, botões e controles compartilhados |
| `layout.css`                    | Cabeçalho, navegação e aviso demonstrativo          |
| `dashboard.css`                 | Totais e fila editorial                             |
| `catalog.css`                   | Painéis, filtros, tabela e estados editoriais       |
| `editor.css`                    | Janela de edição e campos                           |
| `login.css`                     | Entrada demonstrativa                               |
| `motion.css`                    | Transições e preferência por movimento reduzido     |
| `responsive.css`                | Adaptações para telas menores e maior contraste     |

As fontes e as variáveis de cor vêm de `src/styles/fonts.css` e `src/styles/tokens.css`. Esses arquivos são compartilhados com a vitrine: mudar um token na raiz pode mudar as duas aplicações. Para uma correção exclusiva da gestão, prefira uma regra localizada em `gestao/src/styles/`. Consulte `gestao/DESIGN.md` antes de criar outra cor ou medida.

A marca própria da gestão está em `ManagementBrand.vue`. O símbolo é composto em `ManagementSymbol.vue` com duas camadas SVG originais exportadas da prancha `20:2` do Figma. Os arquivos de marca ficam em `public/brand/management-*.svg`, sem fundos adicionados, e a variante negativa atende ao tema escuro. As animações de entrada ficam em `gestao/src/styles/motion.css`; o layout do login está em `login.css`.

`gestao/src/config/navigation.js` reúne os links do menu, o endereço da vitrine e `assetUrl()`. `VITE_PUBLIC_SITE_URL` permite definir o destino do link para a vitrine; o padrão local é `http://localhost:4180/`.

## 6. Verificar uma mudança

Na raiz, rode `npm run build:gestao`, `npm run test:gestao:unit` e `npm run test:gestao:e2e` conforme a mudança. Os testes de interface usam `playwright.gestao.config.js`; os testes da gestão ficam em `gestao/tests/`. Rode `npm run format:check` para conferir o formato. `npm run format` formata todo o escopo configurado do repositório, então revise o diff antes de incluir alterações fora da gestão.

Na interface, confira entrada e saída, navegação, busca sem resultados, edição com erro e com sucesso, tema e uma largura de celular. Após recarregar, a edição temporária deve desaparecer e a vitrine pública deve continuar intacta.

## 7. Trocar o serviço no futuro

O ponto inicial para uma integração é `gestao/src/services/catalogService.js`, que hoje entrega `{ records, categories }` sem requisições. Um serviço real pode buscar esses dados, mas trocar a leitura não torna `save()` e `publish()` persistentes: essas ações ainda alteram somente a memória.

Antes de integrar, defina o contrato do servidor, os identificadores, os erros esperados e as regras de acesso. Implemente autenticação e autorização no servidor; substitua o marcador demonstrativo por um fluxo adequado. Só depois adapte leitura, gravação e publicação, incluindo estados de espera e falha e testes dos contratos. Validação no navegador ajuda a pessoa a preencher; o servidor também precisa validar e autorizar cada operação.

Mantenha a integração separada dos componentes de apresentação e preserve a separação da vitrine pública. Esta organização facilita estudar e substituir partes, mas não representa um backend pronto nem uma área protegida.

## Como funciona o formulário de login

- `src/pages/ManagementLoginPage.vue`: organiza a foto, a marca e o formulário; recebe o evento de entrada.
- `src/components/layout/DemoLoginForm.vue`: exibe os campos, a validação visual e o controle de mostrar senha usando Quasar.
- `src/composables/useDemoLogin.js`: guarda o e-mail e a senha digitados somente em memória, confere os valores de exemplo e chama a ação de entrada.
- `src/config/demoAccess.js`: contém o e-mail e a senha públicos da demonstração. Esses valores não são segredos e não protegem dados.
- `src/styles/login.css` e `motion.css`: composição responsiva e animações curtas.

O componente emite `enter` quando os dados demonstrativos estão corretos. A página então ativa a sessão demonstrativa e navega para o painel. Não são criadas contas e os campos não são enviados por rede ou salvos no navegador. Para implementar autenticação real futuramente, será necessário substituir essa conferência local por um serviço de servidor e autorização próprios.

## Fotos e persistência local

`components/catalog/PhotoUpload.vue` prepara as imagens com `utils/media.js`, com validação de assinatura, tipo, tamanho e decodificação. A galeria guarda data URLs reduzidas; retratos são opcionais. `services/catalogStorage.js` grava o catálogo em IndexedDB e rejeita revisões antigas de outras abas. A store só atualiza a interface após a transação concluir. Para publicar online, substitua esse serviço por API autenticada e armazenamento de arquivos; o painel atual não oferece autenticação real.
