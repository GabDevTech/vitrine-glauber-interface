import { createRouter, createWebHistory } from 'vue-router'
import { useManagementSession } from '../stores/session'

const router = createRouter({
  // As rotas já têm /gestao; a base do Vite organiza os arquivos estáticos.
  history: createWebHistory(),
  scrollBehavior(to, from) {
    return to.path === from.path ? false : { top: 0 }
  },
  routes: [
    { path: '/', redirect: '/gestao/login' },
    { path: '/gestao', redirect: '/gestao/painel' },
    {
      path: '/gestao/login',
      component: () => import('../pages/ManagementLoginPage.vue'),
    },
    {
      path: '/gestao',
      component: () => import('../layouts/ManagementLayout.vue'),
      meta: { requiresDemoSession: true },
      children: [
        {
          path: 'painel',
          component: () => import('../pages/ManagementDashboardPage.vue'),
          meta: { title: 'Visão geral' },
        },
        {
          path: 'boxes',
          component: () => import('../pages/ManagementWorkspacePage.vue'),
          props: { kind: 'box' },
          meta: { title: 'Boxes' },
        },
        {
          path: 'produtos',
          component: () => import('../pages/ManagementWorkspacePage.vue'),
          props: { kind: 'product' },
          meta: { title: 'Produtos' },
        },
        {
          path: 'revisoes',
          component: () => import('../pages/ManagementWorkspacePage.vue'),
          props: { kind: 'review' },
          meta: { title: 'Revisões' },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/gestao/painel' },
  ],
})
// Fluxo demonstrativo, não autenticação nem proteção de dados reais.
router.beforeEach((to) => {
  const session = useManagementSession()
  if (to.meta.requiresDemoSession && !session.active) return '/gestao/login'
  if (to.path === '/gestao/login' && session.active) return '/gestao/painel'
})
router.afterEach((to) => {
  document.title = `${to.meta.title || 'Acesso demonstrativo'} | Gestão Vitrine Glauber`
})
export default router
