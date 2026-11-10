export const navigation = [
  {
    label: 'Visão geral',
    shortLabel: 'Início',
    icon: 'space_dashboard',
    to: '/gestao/painel',
  },
  { label: 'Boxes', shortLabel: 'Boxes', icon: 'storefront', to: '/gestao/boxes' },
  {
    label: 'Produtos',
    shortLabel: 'Produtos',
    icon: 'shopping_bag',
    to: '/gestao/produtos',
  },
  {
    label: 'Revisões',
    shortLabel: 'Revisões',
    icon: 'fact_check',
    to: '/gestao/revisoes',
  },
]
export const publicSiteUrl =
  import.meta.env.VITE_PUBLIC_SITE_URL || 'http://localhost:4180/'
export const assetUrl = (path) =>
  import.meta.env.BASE_URL + String(path).replace(/^\//, '')
