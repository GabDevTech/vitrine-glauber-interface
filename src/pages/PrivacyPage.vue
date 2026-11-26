<script setup>
import { usePageMeta } from '../composables/usePageMeta'
usePageMeta({
  title: 'Privacidade',
  description:
    'Como funcionam as preferências, os favoritos e os serviços externos na Vitrine Glauber.',
})
</script>
<template>
  <q-page class="reading-page page-container">
    <h1>Privacidade, com clareza.</h1>
    <p>
      Esta demonstração é um catálogo público. Não solicita cadastro, documentos, dados
      bancários ou pagamento.
    </p>
    <h2>O que fica no seu navegador</h2>
    <p>
      Favoritos e preferências de acessibilidade são salvos no armazenamento local deste
      dispositivo. Não são enviados a um servidor. Ao limpar os dados do navegador, essas
      escolhas podem ser removidas.
    </p>
    <h2>Mapas e links externos</h2>
    <p>
      O mapa integrado do Google é carregado apenas quando você seleciona “Mostrar mapa
      interativo”. Ao abrir uma rota, o Google Maps passa a aplicar suas próprias
      políticas. Fotografias e fontes da interface são servidas junto com o site.
    </p>
    <h2>Contato com expositores</h2>
    <p>
      Os contatos desta demonstração estão desativados. Na versão real, o contato poderá
      abrir uma conversa no WhatsApp, sujeita às políticas desse serviço. A negociação
      será feita diretamente com o expositor.
    </p>
    <h2>Conteúdo demonstrativo</h2>
    <p>
      Os nomes, produtos, valores e contatos são fictícios. As imagens são ilustrativas e
      não representam os expositores. Os dados precisam ser revisados antes da publicação
      de um catálogo real.
    </p>
  </q-page>
</template>
