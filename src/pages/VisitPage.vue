<script setup>
import { ref } from 'vue'
import { usePageMeta } from '../composables/usePageMeta'
const showMap = ref(false)
const mapUrl =
  'https://www.google.com/maps/search/?api=1&query=Centro+Cultural+Glauber+Rocha+Vitoria+da+Conquista'
const tips = [
  {
    icon: 'schedule',
    title: 'Confira o horário',
    text: 'Cada box tem seus dias e horários. Consulte o perfil e confirme antes de sair.',
  },
  {
    icon: 'storefront',
    title: 'Encontre seu box',
    text: 'O perfil de cada expositor informa a ala e o ponto de referência dentro do espaço.',
  },
  {
    icon: 'accessible',
    title: 'Planeje seu acesso',
    text: 'Para necessidades específicas de mobilidade, confirme as condições atuais com o centro cultural.',
  },
]
usePageMeta({
  title: 'Planeje sua visita',
  description:
    'Saiba como chegar ao Centro Cultural Glauber Rocha, em Vitória da Conquista.',
})
</script>
<template>
  <q-page class="page-container listing-page">
    <header class="page-intro">
      <h1>Tem muito mais quando é de perto.</h1>
      <p>Organize seus achados, combine com quem faz e venha viver o Glauber.</p>
    </header>
    <section class="visit-location">
      <div class="visit-location-copy">
        <q-icon name="location_on" size="40px" />
        <h2>Centro Cultural<br />Glauber Rocha</h2>
        <p>Vitória da Conquista, Bahia</p>
        <q-btn
          color="primary"
          unelevated
          no-caps
          icon="directions"
          label="Traçar rota no Google Maps"
          :href="mapUrl"
          target="_blank"
          rel="noopener noreferrer"
        />
        <p class="external-note">Abre o Google Maps em uma nova aba.</p>
      </div>
      <div class="map-panel">
        <iframe
          v-if="showMap"
          title="Mapa do Centro Cultural Glauber Rocha"
          src="https://www.google.com/maps?q=Centro%20Cultural%20Glauber%20Rocha%2C%20Vit%C3%B3ria%20da%20Conquista%2C%20BA&amp;output=embed"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
        <div v-else class="map-placeholder">
          <q-icon name="map" />
          <h3>Seu próximo ponto de encontro.</h3>
          <p>O mapa é carregado pelo Google somente se você escolher abri-lo.</p>
          <q-btn
            outline
            no-caps
            color="primary"
            label="Mostrar mapa interativo"
            @click="showMap = true"
          />
        </div>
      </div>
    </section>
    <section class="visit-tips">
      <article v-for="tip in tips" :key="tip.title">
        <q-icon :name="tip.icon" />
        <h2>{{ tip.title }}</h2>
        <p>{{ tip.text }}</p>
      </article>
    </section>
    <div class="visit-checklist">
      <div>
        <h2>Leve seus favoritos com você.</h2>
        <p>
          Salve os boxes e produtos que quer conhecer. Sua lista fica neste navegador.
        </p>
      </div>
      <q-btn
        color="primary"
        unelevated
        no-caps
        label="Ver minha visita"
        icon="favorite_border"
        to="/favoritos"
      />
    </div>
  </q-page>
</template>
<style scoped>
.visit-location {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  overflow: hidden;
  background: var(--surface);
  box-shadow: var(--shadow-card);
}
.visit-location-copy {
  padding: 44px;
}
.visit-location-copy > .q-icon {
  color: var(--blue);
}
.visit-location-copy h2 {
  font-size: 2.375rem;
  line-height: 1.15;
  font-weight: 500;
  margin: 20px 0 14px;
}
.visit-location-copy > p {
  color: var(--muted);
  margin-bottom: 28px;
}
.visit-location-copy .external-note {
  font-size: 0.75rem;
  margin: 12px 0 0;
}
.map-panel {
  background: var(--blue-soft);
  min-height: 360px;
  display: grid;
}
.map-placeholder {
  display: grid;
  align-content: center;
  justify-items: center;
  padding: 32px;
  text-align: center;
}
.map-placeholder > .q-icon {
  font-size: 3.75rem;
  color: var(--blue);
}
.map-placeholder h3 {
  font-size: 1.75rem;
  font-weight: 500;
  margin: 20px 0 12px;
}
.map-placeholder p {
  color: var(--muted);
  max-width: 35ch;
  font-size: 0.8125rem;
  margin: 0 0 22px;
}
iframe {
  width: 100%;
  height: 100%;
  min-height: 360px;
  border: 0;
}
.visit-tips {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  margin: 50px 0;
}
.visit-tips article {
  padding-top: 24px;
  border-top: 1px solid var(--line);
}
.visit-tips .q-icon {
  font-size: 1.625rem;
  color: var(--blue);
}
.visit-tips h2 {
  font-size: 1.5625rem;
  font-weight: 500;
  margin: 16px 0 12px;
}
.visit-tips p {
  color: var(--muted);
  font-size: 0.875rem;
  line-height: 1.9;
}
.visit-checklist {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 28px;
  padding: 30px;
  background: var(--soft);
  border-radius: 12px;
}
.visit-checklist h2 {
  font-size: 1.75rem;
  font-weight: 500;
  margin: 0 0 12px;
}
.visit-checklist p {
  color: var(--muted);
  font-size: 0.8125rem;
  margin: 0;
}
.visit-checklist .q-btn {
  flex: none;
}
@media (max-width: 760px) {
  .visit-location {
    grid-template-columns: 1fr;
  }
  .visit-location-copy {
    padding: 28px;
  }
  .visit-location-copy h2 {
    font-size: 2rem;
  }
  .visit-tips {
    grid-template-columns: 1fr;
    gap: 20px;
    margin-block: 32px;
  }
  .visit-checklist {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
