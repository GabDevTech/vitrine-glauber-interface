<script setup>
import StatusBadge from '../shared/StatusBadge.vue'
import ManagementImage from '../shared/ManagementImage.vue'
defineProps({ records: Array, review: Boolean, canModerate: Boolean })
defineEmits(['edit', 'approve', 'publish', 'deactivate', 'reactivate', 'delete'])
const priceLabel = (price) =>
  price === null || price === undefined || price === ''
    ? 'Preço não informado'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
        Number(price),
      )
</script>
<template>
  <div class="record-table-container">
    <table class="record-table">
      <caption class="sr-only">
        Cadastros demonstrativos da gestão
      </caption>
      <thead>
        <tr>
          <th scope="col">Cadastro</th>
          <th scope="col">Categoria / box</th>
          <th scope="col">Status</th>
          <th scope="col" class="actions-cell">Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="record in records" :key="`${record.kind}:${record.id}`">
          <th scope="row">
            <div class="record-identity">
              <ManagementImage :src="record.image" />
              <div>
                <strong>{{ record.name }}</strong
                ><small v-if="record.kind === 'box'">{{
                  record.number || 'Box sem número'
                }}</small>
                <span v-else class="record-price">{{ priceLabel(record.price) }}</span>
                <small v-if="record.kind === 'box' && record.owner" class="record-owner">
                  <img
                    v-if="record.ownerPhoto"
                    :src="record.ownerPhoto"
                    alt=""
                    width="24"
                    height="24"
                  />
                  {{ record.owner }}
                </small>
              </div>
            </div>
          </th>
          <td data-label="Categoria / box">
            <span>{{ record.categoryLabel || 'Categoria não informada' }}</span
            ><small v-if="record.boxName">{{ record.boxName }}</small>
          </td>
          <td data-label="Status">
            <div class="status-cell-stack">
              <StatusBadge :value="record.status" />
              <small
                class="visibility-indicator"
                :class="`is-${record.contentStatus || 'unpublished'}`"
              >
                {{
                  record.contentStatus === 'published'
                    ? '● No ar na vitrine'
                    : record.contentStatus === 'inactive'
                      ? '● Inativado (fora do ar)'
                      : '○ Não publicado (fora do ar)'
                }}
              </small>
            </div>
          </td>
          <td class="actions-cell">
            <div class="table-actions-group">
              <q-btn
                v-if="canModerate && record.status === 'em-revisao'"
                color="primary"
                unelevated
                no-caps
                label="Aprovar"
                :aria-label="`Aprovar ${record.name}`"
                @click="$emit('approve', record)"
              />
              <q-btn
                v-if="
                  canModerate &&
                  record.status === 'pronto' &&
                  record.contentStatus !== 'inactive'
                "
                color="primary"
                unelevated
                no-caps
                label="Publicar"
                :aria-label="`Publicar ${record.name}`"
                @click="$emit('publish', record)"
              />
              <q-btn
                v-if="
                  canModerate &&
                  record.contentStatus === 'inactive' &&
                  record.status === 'pronto'
                "
                color="positive"
                text-color="white"
                unelevated
                no-caps
                label="Reativar"
                :aria-label="`Reativar ${record.name}`"
                @click="$emit('reactivate', record)"
              />
              <q-btn
                outline
                color="primary"
                no-caps
                :label="review ? 'Revisar' : 'Editar'"
                :aria-label="`${review ? 'Revisar' : 'Editar'} ${record.name}`"
                @click="$emit('edit', record)"
              />
              <q-btn
                v-if="canModerate && record.contentStatus !== 'inactive'"
                outline
                color="negative"
                no-caps
                label="Inativar"
                :aria-label="`Inativar ${record.name}`"
                @click="$emit('deactivate', record)"
              />
              <q-btn
                v-if="
                  canModerate &&
                  record.kind === 'box' &&
                  record.contentStatus !== 'published'
                "
                outline
                color="negative"
                no-caps
                label="Excluir"
                :aria-label="`Excluir ${record.name}`"
                @click="$emit('delete', record)"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
