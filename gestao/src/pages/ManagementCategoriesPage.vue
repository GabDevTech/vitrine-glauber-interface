<script setup>
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useManagementCatalog } from '../stores/catalog'
import PageHeading from '../components/shared/PageHeading.vue'

const catalog = useManagementCatalog()
const quasar = useQuasar()
const dialogOpen = ref(false)
const saving = ref(false)
const editing = ref(null)

const iconChoices = [
  { value: 'palette', label: 'Arte e artesanato' },
  { value: 'restaurant', label: 'Gastronomia e sabores' },
  { value: 'checkroom', label: 'Moda e vestuário' },
  { value: 'spa', label: 'Bem-estar e cuidados' },
  { value: 'storefront', label: 'Espaço e comércio' },
  { value: 'shopping_bag', label: 'Produtos e compras' },
  { value: 'redeem', label: 'Presentes e lembranças' },
  { value: 'local_florist', label: 'Plantas e natureza' },
  { value: 'menu_book', label: 'Livros e cultura' },
  { value: 'music_note', label: 'Música e eventos' },
  { value: 'handyman', label: 'Ofícios e utilidades' },
  { value: 'category', label: 'Geral' },
]

const toneChoices = [
  { value: 'blue', label: 'Azul', bg: '#eaf0ff', color: '#1746c8' },
  { value: 'yellow', label: 'Amarelo', bg: '#fff1bb', color: '#755500' },
  { value: 'pink', label: 'Rosa', bg: '#fce1ef', color: '#9d225d' },
  { value: 'green', label: 'Verde', bg: '#dcf0e6', color: '#246a4e' },
]

const form = ref({
  name: '',
  description: '',
  icon: 'category',
  tone: 'blue',
})

function toneMeta(toneValue) {
  return toneChoices.find((t) => t.value === toneValue) || toneChoices[0]
}

onMounted(() => {
  catalog.load()
})

function openCreate() {
  editing.value = null
  form.value = {
    name: '',
    description: '',
    icon: 'category',
    tone: 'blue',
  }
  dialogOpen.value = true
}

function openEdit(category) {
  editing.value = category
  form.value = {
    name: category.name || category.label || '',
    description: category.description || '',
    icon: category.icon || 'category',
    tone: category.tone || 'blue',
  }
  dialogOpen.value = true
}

async function saveCategory() {
  if (saving.value) return
  saving.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      description: form.value.description.trim() || null,
      icon: form.value.icon || 'category',
      tone: form.value.tone || 'blue',
    }
    if (editing.value) {
      await catalog.updateCategory(editing.value, payload)
      quasar.notify({ type: 'positive', message: 'Categoria atualizada.' })
    } else {
      await catalog.createCategory(payload)
      quasar.notify({ type: 'positive', message: 'Categoria criada.' })
    }
    dialogOpen.value = false
  } catch (failure) {
    quasar.notify({
      type: 'negative',
      message: failure.message || 'Não foi possível salvar a categoria.',
    })
  } finally {
    saving.value = false
  }
}

async function toggleActive(category) {
  try {
    await catalog.toggleCategoryActive(category)
    quasar.notify({
      type: 'positive',
      message: category.active ? 'Categoria desativada.' : 'Categoria ativada.',
    })
  } catch (failure) {
    quasar.notify({
      type: 'negative',
      message: failure.message || 'Não foi possível alterar o status da categoria.',
    })
  }
}

async function removeCategory(category) {
  try {
    await catalog.deleteCategory(category)
    quasar.notify({ type: 'positive', message: 'Categoria excluída.' })
  } catch (failure) {
    quasar.notify({
      type: 'negative',
      message: failure.message || 'Não foi possível excluir a categoria.',
    })
  }
}
</script>
<template>
  <section class="workspace-page">
    <PageHeading
      title="Categorias"
      description="Organize as categorias exibidas na vitrine pública e nos cadastros de boxes e produtos."
    >
      <template #actions>
        <q-btn
          color="primary"
          unelevated
          no-caps
          icon="add"
          label="Nova categoria"
          @click="openCreate"
        />
      </template>
    </PageHeading>

    <div class="records-card">
      <table class="records-table">
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Código</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in catalog.categories" :key="cat.apiId || cat.id">
            <td>
              <div class="category-row-identity">
                <span
                  class="category-badge-preview"
                  :style="{
                    background: toneMeta(cat.tone).bg,
                    color: toneMeta(cat.tone).color,
                  }"
                >
                  <q-icon :name="cat.icon || 'category'" size="22px" />
                </span>
                <div>
                  <strong>{{ cat.label }}</strong>
                  <p v-if="cat.description" class="record-subtext">
                    {{ cat.description }}
                  </p>
                </div>
              </div>
            </td>
            <td>
              <code>{{ cat.code || cat.id }}</code>
            </td>
            <td>
              <span
                class="status-pill"
                :class="cat.active ? 'is-published' : 'is-inactive'"
              >
                {{ cat.active ? 'Ativa' : 'Inativa' }}
              </span>
            </td>
            <td class="record-actions">
              <q-btn flat dense no-caps label="Editar" @click="openEdit(cat)" />
              <q-btn
                flat
                dense
                no-caps
                :label="cat.active ? 'Desativar' : 'Ativar'"
                @click="toggleActive(cat)"
              />
              <q-btn
                flat
                dense
                no-caps
                color="negative"
                label="Excluir"
                @click="removeCategory(cat)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <q-dialog v-model="dialogOpen">
      <q-card style="min-width: 360px; max-width: 540px; width: 100%">
        <q-card-section>
          <div class="text-h6">
            {{ editing ? 'Editar categoria' : 'Nova categoria' }}
          </div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <div class="category-live-preview">
            <span
              class="category-badge-preview"
              :style="{
                background: toneMeta(form.tone).bg,
                color: toneMeta(form.tone).color,
              }"
            >
              <q-icon :name="form.icon || 'category'" size="24px" />
            </span>
            <div>
              <strong>{{ form.name.trim() || 'Prévia da categoria' }}</strong>
              <p class="record-subtext">
                {{
                  form.description.trim() ||
                  'Como o card aparecerá na página inicial da vitrine'
                }}
              </p>
            </div>
          </div>

          <q-input
            v-model="form.name"
            outlined
            label="Nome (2 a 80 caracteres)"
            maxlength="80"
          />
          <q-input
            v-model="form.description"
            outlined
            type="textarea"
            autogrow
            label="Descrição (opcional)"
            maxlength="500"
          />

          <div class="picker-section">
            <span class="picker-label">Cor do ícone na vitrine</span>
            <div class="tone-picker-grid" role="radiogroup" aria-label="Cor do ícone">
              <button
                v-for="tone in toneChoices"
                :key="tone.value"
                type="button"
                class="tone-choice-btn"
                :class="{ 'is-selected': form.tone === tone.value }"
                :aria-pressed="form.tone === tone.value"
                @click="form.tone = tone.value"
              >
                <span
                  class="tone-swatch"
                  :style="{ background: tone.bg, borderColor: tone.color }"
                />
                <span>{{ tone.label }}</span>
              </button>
            </div>
          </div>

          <div class="picker-section">
            <span class="picker-label">Ícone da categoria</span>
            <div class="icon-picker-grid" role="radiogroup" aria-label="Ícone da categoria">
              <button
                v-for="item in iconChoices"
                :key="item.value"
                type="button"
                class="icon-choice-btn"
                :class="{ 'is-selected': form.icon === item.value }"
                :title="item.label"
                :aria-label="item.label"
                :aria-pressed="form.icon === item.value"
                @click="form.icon = item.value"
              >
                <q-icon :name="item.value" size="22px" />
              </button>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" v-close-popup />
          <q-btn
            color="primary"
            unelevated
            no-caps
            label="Salvar"
            :loading="saving"
            @click="saveCategory"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </section>
</template>
<style scoped>
.category-row-identity,
.category-live-preview {
  display: flex;
  align-items: center;
  gap: 12px;
}
.category-live-preview {
  padding: 12px 14px;
  border: 1px solid var(--line, #dce2eb);
  border-radius: 14px;
  background: var(--soft, #f5f7fa);
}
.category-badge-preview {
  display: inline-grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  flex: none;
}
.picker-section {
  display: grid;
  gap: 8px;
}
.picker-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--muted, #53627a);
}
.tone-picker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.tone-choice-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--line, #dce2eb);
  border-radius: 10px;
  background: var(--surface, #fff);
  color: inherit;
  cursor: pointer;
  font-size: 0.85rem;
}
.tone-choice-btn.is-selected,
.icon-choice-btn.is-selected {
  border-color: var(--blue, #1746c8);
  box-shadow: 0 0 0 2px rgb(23 70 200 / 18%);
  font-weight: 600;
}
.tone-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid;
}
.icon-picker-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}
.icon-choice-btn {
  display: inline-grid;
  place-items: center;
  height: 44px;
  border: 1px solid var(--line, #dce2eb);
  border-radius: 10px;
  background: var(--surface, #fff);
  color: inherit;
  cursor: pointer;
}
</style>
