import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'

// import() carrega o código de uma página apenas quando ela é visitada.
const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.path === from.path) return false
    if (to.hash) return { el: to.hash, top: 140 }
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', component: () => import('../pages/HomePage.vue') },
        { path: 'boxes', component: () => import('../pages/BoxesPage.vue') },
        {
          path: 'boxes/:slug',
          component: () => import('../pages/BoxPage.vue'),
          props: true,
        },
        { path: 'box/:slug', redirect: (to) => `/boxes/${to.params.slug}` },
        { path: 'produtos', component: () => import('../pages/ProductsPage.vue') },
        {
          path: 'produtos/:slug',
          component: () => import('../pages/ProductPage.vue'),
          props: true,
        },
        {
          path: 'categorias/:categorySlug',
          component: () => import('../pages/BoxesPage.vue'),
        },
        { path: 'favoritos', component: () => import('../pages/FavoritesPage.vue') },
        { path: 'sobre', component: () => import('../pages/AboutPage.vue') },
        { path: 'visite', component: () => import('../pages/VisitPage.vue') },
        {
          path: 'acessibilidade',
          component: () => import('../pages/AccessibilityPage.vue'),
        },
        { path: 'privacidade', component: () => import('../pages/PrivacyPage.vue') },
        { path: ':pathMatch(.*)*', component: () => import('../pages/NotFoundPage.vue') },
      ],
    },
  ],
})
export default router
