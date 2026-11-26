<script setup>
import { computed } from 'vue'
import { useWorkspaceFilters } from '../composables/useWorkspaceFilters'
import { useRecordActions } from '../composables/useRecordActions'
import PageHeading from '../components/shared/PageHeading.vue'
import ManagementState from '../components/shared/ManagementState.vue'
import RecordFilters from '../components/catalog/RecordFilters.vue'
import RecordTable from '../components/catalog/RecordTable.vue'
import RecordEditor from '../components/catalog/RecordEditor.vue'
import ConfirmActionDialog from '../components/shared/ConfirmActionDialog.vue'
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
const {
  editorOpen,
  selected,
  canModerate,
  publishing,
  confirmation,
  confirmOpen,
  create,
  edit,
  approve,
  publish,
  requestDeactivate,
  requestReactivate,
  requestDeleteBox,
  confirmAction,
  cancelConfirmation,
} = useRecordActions(props.kind === 'product' ? 'product' : 'box')
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
          :can-moderate="canModerate"
          @edit="edit"
          @approve="approve"
          @publish="publish"
          @deactivate="requestDeactivate"
          @reactivate="requestReactivate"
          @delete="requestDeleteBox"
        />
      </ManagementState>
    </section>
    <RecordEditor
      v-model="editorOpen"
      :record="selected"
      :kind="kind === 'product' ? 'product' : 'box'"
    />
    <ConfirmActionDialog
      v-model="confirmOpen"
      :title="confirmation?.title"
      :message="confirmation?.message"
      :confirm-label="confirmation?.confirmLabel"
      :confirm-color="confirmation?.confirmColor"
      :confirm-text-color="confirmation?.confirmTextColor"
      :loading="publishing"
      @confirm="confirmAction"
      @cancel="cancelConfirmation"
    />
  </q-page>
</template>
