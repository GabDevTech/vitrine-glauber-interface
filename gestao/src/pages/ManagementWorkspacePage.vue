<script setup>
import { computed } from 'vue'
import { useWorkspaceFilters } from '../composables/useWorkspaceFilters'
import { useRecordActions } from '../composables/useRecordActions'
import PageHeading from '../components/shared/PageHeading.vue'
import ManagementState from '../components/shared/ManagementState.vue'
import RecordFilters from '../components/catalog/RecordFilters.vue'
import RecordTable from '../components/catalog/RecordTable.vue'
import RecordEditor from '../components/catalog/RecordEditor.vue'
const props = defineProps({ kind: { type: String, required: true } })
const labels = {
  box: {
    title: 'Boxes',
    description: 'Informações dos espaços e de quem faz parte da vitrine.',
    action: 'Novo box',
  },
  product: {
    title: 'Produtos',
    description: 'Itens do catálogo, organizados pelo box responsável.',
    action: 'Novo produto',
  },
  review: {
    title: 'Revisões',
    description: 'Rascunhos e cadastros que ainda aguardam uma ação.',
  },
}
const content = computed(() => labels[props.kind])
// O Router recria esta página quando muda o caminho, mas mantém ao filtrar.
const { catalog, search, status, category, boxId, items, update, clear } =
  useWorkspaceFilters(props.kind)
const { editorOpen, selected, create, edit, publish } = useRecordActions(
  props.kind === 'product' ? 'product' : 'box',
)
</script>
<template>
  <q-page class="management-page">
    <PageHeading :title="content.title" :description="content.description"
      ><template v-if="kind !== 'review'" #actions
        ><q-btn
          color="primary"
          unelevated
          no-caps
          icon="add"
          :label="content.action"
          :disable="!catalog.loaded"
          @click="create()" /></template
    ></PageHeading>
    <section class="management-panel">
      <RecordFilters
        :search="search"
        :status="status"
        :category="category"
        :categories="catalog.categories"
        :count="items.length"
        :label="content.title"
        :review="kind === 'review'"
        :box-id="boxId"
        :boxes="catalog.boxes"
        :show-box="kind === 'product' || kind === 'review'"
        @search="update('busca', $event)"
        @status="update('status', $event)"
        @category="update('categoria', $event)"
        @box="update('box', $event)"
        @clear="clear"
      />
      <ManagementState
        :loading="!catalog.loaded && !catalog.error"
        :error="catalog.error"
        :empty="!items.length"
        :clearable="Boolean(search || status || category || boxId)"
        :title="
          kind === 'review' && !search && !status && !category && !boxId
            ? 'Nenhuma revisão pendente'
            : 'Nenhum cadastro encontrado'
        "
        @retry="catalog.load"
        @clear="clear"
      >
        <RecordTable
          :records="items"
          :review="kind === 'review'"
          @edit="edit"
          @publish="publish"
        />
      </ManagementState>
    </section>
    <RecordEditor
      v-model="editorOpen"
      :record="selected"
      :kind="kind === 'product' ? 'product' : 'box'"
    />
  </q-page>
</template>
