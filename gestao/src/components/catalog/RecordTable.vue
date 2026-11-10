<script setup>
import StatusBadge from '../shared/StatusBadge.vue'
import ManagementImage from '../shared/ManagementImage.vue'
defineProps({ records: Array, review: Boolean })
defineEmits(['edit', 'publish'])
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
          <td data-label="Status"><StatusBadge :value="record.status" /></td>
          <td class="actions-cell">
            <q-btn
              v-if="review && record.status === 'pronto'"
              color="primary"
              unelevated
              no-caps
              label="Publicar"
              :aria-label="`Publicar ${record.name} na demonstração`"
              @click="$emit('publish', record)"
            /><q-btn
              v-else
              outline
              color="primary"
              no-caps
              :label="review ? 'Revisar' : 'Editar'"
              :aria-label="`${review ? 'Revisar' : 'Editar'} ${record.name}`"
              @click="$emit('edit', record)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
