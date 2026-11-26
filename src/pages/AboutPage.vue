<script setup>
import { usePageMeta } from '../composables/usePageMeta'
import HomeVisit from '../components/HomeVisit.vue'
usePageMeta({
  title: 'O projeto',
  description: 'Uma janela para quem cria e movimenta o Centro Cultural Glauber Rocha.',
})
</script>
<template>
  <q-page>
    <div class="page-container about-intro">
      <h1>Uma janela aberta<br />para a cultura local.</h1>
      <p>
        A Vitrine Glauber aproxima você das pessoas, dos produtos e das histórias do
        Centro Cultural Glauber Rocha, em Vitória da Conquista.
      </p>
    </div>
    <div class="page-container">
      <img
        class="about-image"
        src="/images/hero-feira-cultural.webp"
        alt="Representação ilustrativa de um encontro entre visitantes e artesãos em feira cultural"
        width="1600"
        height="640"
      />
    </div>
    <section class="page-container about-content">
      <h2>Descobrir antes.<br />Encontrar de verdade.</h2>
      <div>
        <p>
          Uma criação pode ser o começo de uma conversa. Por aqui, você conhece os boxes,
          explora os produtos e guarda o que despertou sua curiosidade.
        </p>
        <p>
          A experiência continua no encontro com quem faz. Disponibilidade, compra e
          retirada são combinadas diretamente com cada expositor.
        </p>
        <p>
          Este é um projeto demonstrativo: nomes, produtos, imagens e contatos são
          ilustrativos. O site não realiza pagamentos ou entregas.
        </p>
        <router-link class="text-link" to="/boxes"
          >Comece pelos boxes <q-icon name="arrow_forward"
        /></router-link>
      </div>
    </section>
    <HomeVisit />
  </q-page>
</template>
<style scoped>
.about-intro {
  padding-block: var(--space-section);
}
.about-intro h1 {
  font-size: clamp(40px, 4.4vw, 60px);
  line-height: 1.1;
  margin: 0;
  font-weight: 500;
}
.about-intro p {
  font-size: 1rem;
  color: var(--muted);
  line-height: 1.9;
  margin: 24px 0 0;
  max-width: 58ch;
}
.about-image {
  width: 100%;
  aspect-ratio: 2.7;
  object-fit: cover;
  border-radius: 16px;
}
.about-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 70px;
  padding-top: 56px;
}
.about-content h2 {
  font-size: 2.375rem;
  line-height: 1.2;
  font-weight: 500;
  margin: 0;
}
.about-content p {
  color: var(--muted);
  font-size: 0.875rem;
  line-height: 1.9;
  margin: 0 0 18px;
}
@media (max-width: 760px) {
  .about-intro,
  .about-content {
    grid-template-columns: 1fr;
    gap: 26px;
    padding-block: 36px;
  }
  .about-image {
    aspect-ratio: 1.3;
  }
}
</style>
