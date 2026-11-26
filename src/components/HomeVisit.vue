<template>
  <section class="visit-banner page-container">
    <div class="visit-invitation">
      <span class="visit-pin"><q-icon name="near_me" /></span>
      <div>
        <h2>A próxima descoberta<br />pode ser ao vivo.</h2>
        <p>Seu passeio pelo Centro Cultural Glauber Rocha começa aqui.</p>
      </div>
    </div>
    <div class="visit-banner-actions">
      <q-btn
        color="warning"
        text-color="secondary"
        unelevated
        no-caps
        label="Planejar minha visita"
        icon-right="arrow_forward"
        to="/visite"
      /><span>Vitória da Conquista · Bahia</span>
    </div>
  </section>
</template>
<style scoped>
.visit-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  padding: 44px 40px;
  margin-block: 48px;
  border-radius: var(--radius-card);
  background: var(--navy);
  color: white;
}
.visit-invitation {
  display: flex;
  align-items: center;
  gap: 28px;
}
.visit-pin {
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  background: rgb(255 255 255 / 10%);
  color: var(--yellow);
  font-size: 2.1875rem;
  border-radius: 50%;
  flex: none;
}
h2 {
  margin: 0 0 12px;
  font-weight: 500;
  font-size: 2.25rem;
  line-height: 1.15;
}
p {
  margin: 0;
  font-size: 0.8125rem;
  color: #d1dcf0;
}
.visit-banner-actions {
  display: grid;
  gap: 14px;
  text-align: center;
  flex: none;
}
.visit-banner-actions span {
  font-size: 0.75rem;
  color: #d1dcf0;
}
@media (max-width: 760px) {
  .visit-banner {
    align-items: stretch;
    flex-direction: column;
    padding: 28px 22px;
    margin-block: 32px;
    gap: 26px;
  }
  .visit-invitation {
    gap: 16px;
  }
  .visit-pin {
    width: 52px;
    height: 52px;
    font-size: 1.625rem;
  }
  h2 {
    font-size: 1.75rem;
  }
}
</style>
