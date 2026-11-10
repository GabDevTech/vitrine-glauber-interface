<script setup>
import DiscoverySearch from './home/DiscoverySearch.vue'
</script>
<template>
  <section class="home-hero">
    <div class="page-container hero-grid">
      <div class="hero-copy">
        <h1>Feito aqui.<br />Viva de perto.</h1>
        <p>
          Descubra produtos, histórias e pessoas do Centro Cultural Glauber Rocha, em
          Vitória da Conquista.
        </p>
        <DiscoverySearch />
      </div>
      <figure class="hero-picture">
        <img
          src="/images/centro-cultural-glauber-rocha.webp"
          alt="Vista aérea da praça e dos boxes do Centro Cultural Glauber Rocha, em Vitória da Conquista"
          width="1676"
          height="939"
          fetchpriority="high"
        />
        <figcaption>
          <span class="picture-dot" aria-hidden="true"></span
          ><span>Centro Cultural<br /><strong>Glauber Rocha</strong></span
          ><router-link
            to="/visite"
            aria-label="Planejar uma visita ao Centro Cultural Glauber Rocha"
            ><q-icon name="north_east"
          /></router-link>
        </figcaption>
        <span class="picture-corner" aria-hidden="true"></span>
        <a
          class="hero-photo-credit"
          href="https://blogdosena.com.br/uso-dos-boxes-do-centro-cultural-glauber-rocha-ganha-nova-regulamentacao/"
          target="_blank"
          rel="noopener noreferrer"
          >Foto: reprodução / Blog do Sena · ampliada com IA</a
        >
      </figure>
    </div>
  </section>
</template>
<style scoped>
.home-hero {
  background: var(--paper);
  padding-top: 32px;
}
.hero-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
  padding-bottom: 28px;
}
h1 {
  font-size: clamp(46px, 4.5vw, 66px);
  line-height: 1.06;
  letter-spacing: -0.04em;
  margin: 0 0 24px;
  max-width: 14ch;
  font-weight: 500;
}
.hero-copy > p {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--muted);
  max-width: 44ch;
  margin: 0 0 28px;
}
.hero-picture {
  margin: 0 0 26px;
  position: relative;
  padding: 0 0 28px 0;
}
.hero-picture > img {
  width: 100%;
  height: 380px;
  object-fit: cover;
  object-position: center;
  border-radius: 90px 14px 14px 14px;
  animation: window-open 780ms var(--ease-out);
}
figcaption {
  position: absolute;
  left: -24px;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 22px;
  width: 280px;
  border-radius: 12px;
  background: var(--brand-blue);
  color: white;
  box-shadow: var(--shadow-overlay);
  animation: window-invitation 560ms var(--ease-out) 100ms backwards;
}
figcaption span {
  font-size: 0.8125rem;
  line-height: 1.6;
}
figcaption strong {
  font-family: var(--font-display);
  font-size: 1.375rem;
  font-weight: 500;
}
figcaption a {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-left: auto;
  font-size: 1.5625rem;
  color: white;
}
.picture-dot {
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--yellow);
}
.picture-corner {
  position: absolute;
  width: 46px;
  height: 46px;
  right: -14px;
  top: -14px;
  border-radius: 50%;
  background: var(--yellow);
}
.hero-photo-credit {
  position: absolute;
  right: 0;
  bottom: -26px;
  display: block;
  margin-top: 10px;
  padding-left: 4px;
  color: var(--muted);
  font-size: 0.6875rem;
  text-align: right;
  text-underline-offset: 3px;
}
@media (max-width: 1000px) {
  .hero-grid {
    gap: 35px;
  }
  .hero-picture > img {
    height: 350px;
  }
  h1 {
    font-size: 3.0625rem;
  }
}
@media (max-width: 760px) {
  .home-hero {
    padding-top: 32px;
  }
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 28px;
    padding-bottom: 26px;
  }
  h1 {
    font-size: clamp(44px, 11.8vw, 62px);
  }
  .hero-copy > p {
    font-size: 0.9375rem;
  }
  .hero-picture {
    margin: 0 0 26px 12px;
    padding-bottom: 20px;
  }
  .hero-picture > img {
    height: 290px;
    border-top-left-radius: 64px;
  }
  figcaption {
    width: 245px;
    left: -12px;
    padding: 14px 17px;
  }
  figcaption strong {
    font-size: 1.4375rem;
  }
  .picture-corner {
    width: 32px;
    height: 32px;
    right: -7px;
    top: -9px;
  }
}
</style>
