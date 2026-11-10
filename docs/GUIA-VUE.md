# Guia de Vue: entendendo a Vitrine Glauber

Este guia parte do básico de HTML, CSS e JavaScript. Você não precisa conhecer Vue para localizar uma alteração. Trabalhe com `npm run dev` aberto e confira http://localhost:4180.

## 1. O que cada ferramenta faz

Vue conecta dados à interface: quando um dado muda, a tela se atualiza. Quasar fornece componentes prontos, como `q-btn` e `q-input`. Vite inicia o servidor e prepara a versão publicada. Vue Router associa endereços a páginas. Pinia mantém dados compartilhados entre páginas.

O projeto usa JavaScript e Composition API com `<script setup>`. Os componentes Quasar no template são reconhecidos pela integração do Vite; componentes próprios são importados no arquivo que os usa.

## 2. Por onde começar a leitura

1. `src/main.js` registra Pinia, Router e Quasar e monta o aplicativo no `#app` de `index.html`.
2. `src/App.vue` entrega a área de navegação ao Router.
3. `src/router/index.js` escolhe a página pelo endereço e envolve as páginas com `MainLayout`.
4. `src/layouts/MainLayout.vue` reúne cabeçalho, rodapé, navegação mobile e conteúdo.
5. `src/pages/HomePage.vue` mostra como compor componentes menores.
6. `src/pages/ProductsPage.vue` mostra carregamento, filtros e repetição dos cards.
7. `src/components/ProductCard.vue` recebe um produto e apresenta suas informações.

## 3. Responsabilidade de cada pasta

| Pasta/arquivo            | Responsabilidade                           | Exemplo de mudança           |
| ------------------------ | ------------------------------------------ | ---------------------------- |
| `src/pages/`             | Telas associadas a rotas                   | Texto de uma página          |
| `src/layouts/`           | Estrutura que envolve várias telas         | Organização geral            |
| `src/components/`        | Partes visuais reutilizáveis               | Cards e filtros              |
| `src/components/layout/` | Cabeçalho, marca, rodapé e acessibilidade  | Menu principal               |
| `src/components/home/`   | Busca e categorias do início               | Descoberta inicial           |
| `src/components/shared/` | Pequenas peças comuns                      | Favorito, contato e imagem   |
| `src/data/catalog.js`    | Fonte do seed e migração de favoritos      | Referência demonstrativa     |
| `src/services/`          | Consulta e adaptação da API                | Carregar o catálogo público  |
| `src/stores/`            | Estado compartilhado                       | Catálogo e favoritos         |
| `src/composables/`       | Comportamento reutilizável de Vue          | Filtros, voz e preferências  |
| `src/utils/`             | Funções sem interface                      | Busca, moeda e armazenamento |
| `src/router/`            | Endereços e páginas                        | Nova rota                    |
| `src/config/`            | Marca, modo demonstrativo e navegação      | Itens do menu                |
| `src/styles/`            | Fontes, tokens, movimento e estilos comuns | Cores e largura              |
| `public/`                | Arquivos servidos diretamente              | Imagens, símbolos e fontes   |
| `tests/`                 | Verificação automatizada                   | Regras e navegação           |

Não coloque uma chamada de API no card: manter responsabilidades separadas permite alterar uma camada sem reescrever as outras.

## 4. Anatomia de um arquivo `.vue`

```vue
<script setup>
import { computed, ref } from 'vue'
const quantidade = ref(1)
const dobro = computed(() => quantidade.value * 2)
</script>

<template>
  <section>
    <p>Quantidade: {{ quantidade }}. Dobro: {{ dobro }}.</p>
    <q-btn label="Adicionar" @click="quantidade++" />
  </section>
</template>

<style scoped>
p {
  color: var(--text);
}
</style>
```

`script setup` contém a lógica. `template` descreve a interface. `style scoped` limita o CSS ao componente. `{{ valor }}` escreve texto; `:atributo="expressao"` conecta um atributo a JavaScript; `@click` reage a um evento. `v-if` mostra algo conforme uma condição; `v-for` repete elementos e precisa de uma `:key` estável, como `product.id`. `v-model` conecta leitura e atualização de um campo.

| Conceito    | Significado                                          | Exemplo no projeto         |
| ----------- | ---------------------------------------------------- | -------------------------- |
| `ref`       | Valor que pode mudar e atualizar a tela              | Abertura do mapa           |
| `computed`  | Resultado recalculado quando suas dependências mudam | Lista filtrada             |
| `watch`     | Efeito executado quando um dado muda                 | Salvar favoritos           |
| `onMounted` | Executa quando o componente entra na interface       | Solicitar catálogo         |
| `props`     | Dados recebidos do componente pai                    | `product` em `ProductCard` |
| `emits`     | Eventos enviados ao pai                              | Mudança de categoria       |

Em JavaScript, acesse uma ref com `.value`; no template, Vue faz isso automaticamente. Pinia também permite acessar `catalog.products` sem `.value`. Evite desestruturar diretamente o estado da store; se precisar, use `storeToRefs` do Pinia para preservar a reatividade.

Trate props como entrada. Para pedir uma mudança, o filho emite um evento:

```vue
<!-- Exemplo didático: BotaoContador.vue -->
<script setup>
defineProps({ valor: { type: Number, default: 0 } })
const emit = defineEmits(['incrementar'])
</script>
<template>
  <q-btn :label="`Cliques: ${valor}`" @click="emit('incrementar')" />
</template>
```

O pai usa `<BotaoContador :valor="quantidade" @incrementar="quantidade++" />`. Esse contrato de entrada e evento também organiza `CatalogFilters`.

## 5. Como os dados chegam à tela

O caminho é **PostgreSQL → API → serviço → store → página → componente**:

1. A API consulta o PostgreSQL e entrega categorias, boxes, produtos e mídias publicados em `/api/v1`.
2. `services/catalogService.js` busca todas as páginas de catálogo e adapta a resposta da API para os componentes. IDs `BIGINT` permanecem textos; preços chegam como centavos; um box pode ter várias categorias.
3. `stores/catalog.js` mantém registros e estados `loading`, `loaded` e `error`. `loadCatalog()` compartilha uma solicitação em andamento e evita recarregar dados disponíveis. `{ force: true }` permite tentar novamente.
4. `ProductsPage.vue` solicita o catálogo em `onMounted`. `CatalogState` organiza carregamento, erro, vazio e nova tentativa.
5. `useCatalogFilters('products')` calcula resultados e a página entrega cada registro ao `ProductCard` por prop.

O serviço devolve `{ boxes, categories, products }`. O Vite encaminha `/api/v1` para a API local na porta 3000. Sem API ou banco, `CatalogState` mostra erro e permite tentar novamente. Os filtros da URL continuam calculados no navegador após o carregamento do catálogo.

## 6. Adicionar um produto

O catálogo exibido vem do PostgreSQL. A área de gestão ainda não grava nele; para adicionar um produto público agora, será necessário implementar o fluxo administrativo aprovado na API. O exemplo abaixo mostra a forma adaptada que a página recebe do serviço, apenas para leitura:

```js
{
  id: '9',
  slug: 'prato-serra',
  boxId: '1',
  name: 'Prato Serra',
  category: 'artesanato',
  priceCents: 6200,
  image: '/api/v1/media/15',
  description: 'Prato artesanal de cerâmica, em edição demonstrativa.',
}
```

Os IDs chegam como texto para preservar a precisão de `BIGINT`. O slug forma `/produtos/prato-serra`; `boxId` corresponde ao ID de um box publicado. `priceCents` guarda centavos inteiros, e `formatPrice` produz a apresentação em reais. A mídia é entregue pela API, que verifica se o vínculo é público. O seed demonstrativo permanece como fonte inicial do banco; editar `src/data/catalog.js` isoladamente não altera a vitrine em execução.

## 7. Adicionar uma página e sua rota

Crie `src/pages/AgendaPage.vue`:

```vue
<script setup>
import { usePageMeta } from '../composables/usePageMeta'
usePageMeta({ title: 'Agenda', description: 'Encontros e atividades do Glauber.' })
</script>
<template>
  <q-page class="page-container reading-page">
    <h1>Agenda do Glauber</h1>
    <p>Consulte aqui as próximas atividades confirmadas.</p>
  </q-page>
</template>
```

Em `src/router/index.js`, adicione ao array `children`, antes da rota final de página não encontrada:

```js
{ path: 'agenda', component: () => import('../pages/AgendaPage.vue') },
```

O endereço será `/agenda`. O `import()` carrega o código da página apenas quando ela é visitada. A página herda o layout principal. Para um link visível, altere o componente apropriado ou `src/config/navigation.js`, conforme o menu desejado. Use `<router-link to="/agenda">Agenda</router-link>` para navegação interna.

## 8. Filtros pertencem à URL

Experimente `/produtos?busca=cafe&categoria=alimentacao&ordem=menor-preco`. `useCatalogFilters` lê os parâmetros; a função pura `filterCatalog` aplica a regra. O link pode ser copiado e recarregado com os mesmos filtros. `/categorias/:categorySlug` abre boxes daquela categoria.

Os filtros usam `router.replace`: cada tecla ou ordenação não cria uma entrada no histórico. Voltar retorna à navegação anterior; não desfaz cada edição do filtro. Não crie uma segunda cópia dos filtros na store, pois ela poderia divergir da URL.

## 9. Cores, fontes e componentes

Altere cores em `src/styles/tokens.css`, seguindo [DESIGN.md](../DESIGN.md). `--brand-blue` mantém o royal em superfícies preenchidas; `--blue` serve aos links e foco e clareia no modo escuro. Para mudar cores do Quasar, atualize também `src/config/brand.js`.

Fontes locais ficam em `public/fonts` e são registradas em `src/styles/fonts.css`. `--font-display` seleciona Outfit para títulos; `--font-body`, Inter para leitura. Ao trocar, registre arquivos e pesos e confira a licença: mudar só o nome não baixa a fonte. CSS comum fica em `app.css`; regras específicas ficam no `<style scoped>` do componente.

Para mudar todos os cards de produto, edite `ProductCard.vue`. Para mudar a organização do catálogo, edite a página ou a grade compartilhada. Preserve textos alternativos, rótulos, foco de teclado e a separação entre link e botão de favorito.

### Alterar movimento com segurança

`src/styles/tokens.css` define os tempos comuns: `--motion-fast` (140ms), `--motion-ui` (260ms), `--motion-view` (220ms) e `--ease-out`. `src/styles/motion.css`, importado por `app.css`, reúne os keyframes e as transições de páginas, menu e controles. Os componentes escolhem onde aplicar os efeitos: `HomeHero.vue` abre a fotografia em 780ms e a legenda em 560ms; `FavoriteButton.vue` confirma a seleção em 280ms. Para mudar um tempo global, altere o token; para mudar apenas um efeito, procure sua classe no componente e seu keyframe em `motion.css`.

Em `MainLayout.vue`, o `Transition` usa `:key="route.path"`. A chave deixa a troca de página acompanhar o caminho, como `/produtos` para `/boxes`. Ela exclui a query de propósito: digitar uma busca ou trocar uma categoria atualiza os resultados sem desmontar a página nem disparar uma nova transição. Preserve essa escolha ao mexer nos filtros.

Mantenha os efeitos curtos e finitos. O conteúdo já aparece sem JavaScript de rolagem; não é necessário adicionar um observador para revelar seções. Confira a preferência de redução de movimento tanto no sistema quanto nas opções do site. As regras ficam em `motion.css`; preserve também as regras que removem transformações nos componentes. No menu mobile, confira abertura, saída e Esc, que devolve o foco ao botão. O registro das melhorias visuais está em `docs/MELHORIAS-VISUAIS.md`.

## 10. Favoritos, acessibilidade e serviços externos

`stores/favorites.js` guarda chaves com tipo e ID da API, como `product:9`, em `vitrine:favorites:v2`. Na primeira carga bem-sucedida, migra favoritos antigos por slug a partir do catálogo demonstrativo, preservando a chave antiga. `utils/storage.js` trata falhas de armazenamento. A lista é local, pode desaparecer ao limpar o navegador e não acompanha o visitante em outro aparelho.

`useAccessibility` aplica tema escuro, contraste, texto maior e redução de movimento. `useSpeech` concentra a leitura em voz, cuja disponibilidade e vozes dependem do navegador. Isso complementa a interface sem substituir leitores de tela. `useShare` centraliza o compartilhamento.

`ContactButton` consulta `isDemo` em `src/config/brand.js`: enquanto verdadeiro, o clique explica que o expositor é demonstrativo. Antes de habilitar contato, substitua e valide **todos** os números e informações fictícias; não basta trocar a flag. Na visita, o mapa incorporado do Google só carrega após a escolha do visitante. O botão de rota abre um serviço externo.

## 11. Verificar uma alteração

Execute `npm test` para regras de catálogo e armazenamento e `npm run build` para a compilação. Para interface, instale Chromium com `npx playwright install chromium` e execute `npm run test:e2e`. Testes de navegador exercitam jornadas, estados e verificações automatizadas de acessibilidade. Não substituem revisão humana.

Confira telas estreitas e largas, Tab e Enter, busca vazia, retorno pelo navegador, tema escuro, favoritos e detalhes. Uma mudança de texto não precisa de teste que repita o texto, mas uma regra nova de busca merece uma verificação de comportamento.

## 12. O que depende de um produto real

A API pública já entrega o catálogo demonstrativo do PostgreSQL, mas ainda não existem autenticação, cadastro administrativo, publicação pela gestão, sincronização entre aparelhos ou checkout. Estoque, preços, nomes, histórias, localização interna e horários precisam de confirmação real. Não há envio de mensagem no modo demonstrativo. Para publicar, configure fallback para `index.html`, encaminhamento de `/api/v1` à API e revise conteúdo, privacidade, licenças e integrações efetivamente utilizadas.
