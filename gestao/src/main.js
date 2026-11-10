import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Notify } from 'quasar'
import ptBR from 'quasar/lang/pt-BR'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import '../../src/styles/fonts.css'
import '../../src/styles/tokens.css'
import './styles/management.css'
import { brand } from '../../src/config/brand'
import App from './App.vue'
import router from './router'

createApp(App)
  .use(createPinia())
  .use(router)
  .use(Quasar, { plugins: { Notify }, lang: ptBR, config: { brand } })
  .mount('#app')
