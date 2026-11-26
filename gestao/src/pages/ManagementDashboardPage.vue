<script setup>
import { useManagementCatalog } from '../stores/catalog'
import { useRecordActions } from '../composables/useRecordActions'
import PageHeading from '../components/shared/PageHeading.vue'
import ManagementState from '../components/shared/ManagementState.vue'
import ManagementMetrics from '../components/dashboard/ManagementMetrics.vue'
import ReviewQueue from '../components/dashboard/ReviewQueue.vue'
import RecordEditor from '../components/catalog/RecordEditor.vue'
import CatalogOverview from '../components/dashboard/CatalogOverview.vue'
import PublicationOverview from '../components/dashboard/PublicationOverview.vue'
import CategoryOverview from '../components/dashboard/CategoryOverview.vue'
const catalog = useManagementCatalog()
const { editorOpen, selected, createKind, create, edit, publish } = useRecordActions()
</script>
<template>
  <q-page class="management-page">
    <PageHeading
      title="Visão geral"
      description="Cuide da vitrine, uma tarefa de cada vez."
    >
      <template #actions>
        <q-btn
          outline
          color="primary"
          no-caps
          icon="add"
          label="Novo box"
          :disable="!catalog.loaded"
          @click="create('box')"
        />
        <q-btn
          color="primary"
          unelevated
          no-caps
          icon="add"
          label="Novo produto"
          :disable="!catalog.loaded"
          @click="create('product')"
        />
      </template>
    </PageHeading>
    <ManagementState
      :loading="!catalog.loaded && !catalog.error"
      :error="catalog.error"
      @retry="catalog.load"
    >
      <ManagementMetrics :summary="catalog.summary" />
      <div class="dashboard-workspace">
        <div class="dashboard-main">
          <ReviewQueue :records="catalog.pending" @edit="edit" @publish="publish" />
          <CatalogOverview
            :records="catalog.records"
            :categories="catalog.categories"
            @edit="edit"
          />
        </div>
        <aside class="dashboard-support" aria-label="Publicação e cadastros">
          <PublicationOverview :records="catalog.records" />
          <CategoryOverview :records="catalog.records" :categories="catalog.categories" />
        </aside>
      </div>
    </ManagementState>
    <RecordEditor v-model="editorOpen" :record="selected" :kind="createKind" />
  </q-page>
</template>
