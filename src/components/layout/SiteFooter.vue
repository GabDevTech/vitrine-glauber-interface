<script setup>
import BrandLogo from './BrandLogo.vue'
</script>

<template>
  <footer class="site-footer">
    <div class="page-container footer-main">
      <div class="footer-brand">
        <router-link to="/" aria-label="Vitrine Glauber — início"
          ><BrandLogo light
        /></router-link>
        <p>Uma janela para a cultura,<br />as pessoas e os encontros de Conquista.</p>
      </div>
      <div>
        <h2>Explore a vitrine</h2>
        <router-link to="/boxes">Conheça os boxes</router-link
        ><router-link to="/produtos">Descubra os produtos</router-link
        ><router-link to="/favoritos">Minha visita</router-link>
      </div>
      <div>
        <h2>Venha conhecer</h2>
        <p>Centro Cultural Glauber Rocha<br />Vitória da Conquista, Bahia</p>
        <router-link to="/visite" class="footer-route"
          >Veja como chegar <q-icon name="north_east"
        /></router-link>
      </div>
      <div>
        <h2>Sobre a Vitrine</h2>
        <router-link to="/sobre">O projeto</router-link
        ><router-link to="/acessibilidade">Acessibilidade</router-link
        ><router-link to="/privacidade">Privacidade</router-link>
      </div>
    </div>
    <div class="page-container footer-bottom">
      <span>Vitrine Glauber · Cultura que aproxima.</span
      ><span>Versão demonstrativa · Imagens e expositores ilustrativos.</span>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background: var(--navy);
  color: white;
  padding: 56px 0 0;
}
.footer-main {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1.3fr 1fr;
  gap: 40px;
  padding-bottom: 50px;
}
h2 {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 600;
  margin: 0 0 20px;
}
p,
a:not(:has(.brand)) {
  color: #d1dcf0;
  font-size: 0.8125rem;
  line-height: 1.9;
}
p {
  margin: 0;
}
.footer-brand p {
  margin-top: 20px;
}
.footer-main > div > a {
  display: block;
  width: fit-content;
  padding: 3px 0;
}
.footer-main a:hover {
  text-decoration: underline;
}
.footer-route {
  margin-top: 10px;
  color: white !important;
}
.footer-bottom {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding-block: 22px;
  border-top: 1px solid #365076;
  color: #c8d5ed;
  font-size: 0.75rem;
}
@media (max-width: 760px) {
  .site-footer {
    padding-bottom: 76px;
  }
  .footer-main {
    grid-template-columns: 1fr 1fr;
    gap: 32px 24px;
  }
  .footer-brand {
    grid-column: 1 / -1;
  }
  .footer-bottom {
    flex-direction: column;
    gap: 6px;
  }
}
@media (max-width: 380px) {
  .footer-main {
    grid-template-columns: 1fr;
  }
}
</style>
