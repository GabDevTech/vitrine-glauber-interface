import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Notify } from 'quasar'
import ptBR from 'quasar/lang/pt-BR'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import './styles/app.css'
import App from './App.vue'
import router from './router'
import { brand } from './config/brand'

// A ordem registra o estado, as rotas e os componentes do Quasar antes da montagem.
createApp(App)
  .use(createPinia())
  .use(router)
  .use(Quasar, { plugins: { Notify }, lang: ptBR, config: { brand } })
  .mount('#app')
