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
      path: '/gestao/convite/aceitar',
      component: () => import('../pages/ManagementInvitationAcceptancePage.vue'),
      meta: { title: 'Aceitar convite' },
    },
    {
      path: '/gestao',
      component: () => import('../layouts/ManagementLayout.vue'),
      meta: { requiresSession: true },
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
router.beforeEach(async (to) => {
  const session = useManagementSession()
  try {
    await session.initialize({ force: true })
  } catch {
    // A rota pública permanece acessível quando não há sessão válida.
  }
  if (to.meta.requiresSession && !session.active) return '/gestao/login'
  if (to.path === '/gestao/login' && session.active) return '/gestao/painel'
})
router.afterEach((to) => {
  document.title = `${to.meta.title || 'Acesso demonstrativo'} | Gestão Vitrine Glauber`
})
export default router
