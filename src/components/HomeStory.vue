<template>
  <section class="story-section">
    <div class="page-container story-grid">
      <img
        src="/images/produtos-artesanais.webp"
        alt="Composição ilustrativa com cerâmicas, bolsas, sabonetes e doces artesanais"
        width="1000"
        height="1000"
        loading="lazy"
      />
      <div class="story-copy">
        <h2>Cada criação carrega<br />um pouco daqui.</h2>
        <p>
          Tem o cuidado de quem faz à mão, a receita que atravessa gerações e a
          criatividade que encontra novos caminhos.
        </p>
        <p>
          A Vitrine Glauber aproxima você dessas histórias. Descubra um novo favorito e
          conheça de perto quem dá vida a ele.
        </p>
        <q-btn
          color="primary"
          unelevated
          no-caps
          label="Conheça o projeto"
          icon-right="arrow_forward"
          to="/sobre"
        />
      </div>
    </div>
  </section>
</template>
<style scoped>
.story-section {
  background: var(--soft);
  padding-block: var(--space-section);
}
.story-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 90px;
  align-items: center;
}
img {
  width: 100%;
  aspect-ratio: 1.2;
  object-fit: cover;
  border-radius: var(--radius-card);
}
h2 {
  font-size: clamp(32px, 3.5vw, 46px);
  line-height: 1.13;
  margin: 0 0 26px;
  font-weight: 500;
}
p {
  font-size: 0.9375rem;
  color: var(--muted);
  line-height: 1.9;
  margin: 0 0 16px;
  max-width: 44ch;
}
.q-btn {
  margin-top: 12px;
}
@media (max-width: 760px) {
  .story-section {
    padding-block: 48px;
  }
  .story-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  img {
    max-height: 330px;
  }
}
</style>
