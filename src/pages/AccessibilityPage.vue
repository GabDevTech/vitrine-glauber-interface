<script setup>
import { usePageMeta } from '../composables/usePageMeta'
usePageMeta({
  title: 'Acessibilidade',
  description: 'Conheça as opções de leitura, contraste e navegação da Vitrine Glauber.',
})
</script>
<template>
  <q-page class="reading-page page-container">
    <h1>Uma vitrine para mais pessoas.</h1>
    <p>
      A navegação foi pensada para funcionar em celulares, com teclado e com tecnologias
      assistivas. As opções de acessibilidade ficam no botão de pessoa, no cabeçalho.
    </p>
    <h2>A leitura do seu jeito</h2>
    <p>
      Você pode aumentar o texto, reforçar o contraste, ativar o modo escuro e reduzir o
      movimento. As preferências são guardadas apenas neste navegador, quando o
      armazenamento está disponível.
    </p>
    <h2>Ouça o conteúdo</h2>
    <p>
      O botão "Iniciar leitura", nas opções de acessibilidade, lê os títulos, parágrafos e
      listas visíveis da página em português. O trecho narrado aparece no painel para
      acompanhar a leitura. Você pode ajustar a velocidade, voltar ou avançar entre
      trechos, pausar, continuar e parar. A disponibilidade e as vozes dependem do
      navegador e do dispositivo. O recurso não utiliza o microfone.
    </p>
    <h2>Navegue com o teclado</h2>
    <ul>
      <li>Use Tab para avançar e Shift + Tab para voltar entre links e controles.</li>
      <li>Use Enter para abrir links e Enter ou Espaço para acionar botões.</li>
      <li>O primeiro link permite pular diretamente ao conteúdo principal.</li>
      <li>Use Escape para fechar diálogos.</li>
    </ul>
    <h2>Recursos da interface</h2>
    <p>
      Imagens têm descrições, os campos possuem rótulos e os filtros informam a quantidade
      de resultados. O site também respeita a redução de movimento configurada no
      dispositivo.
    </p>
    <h2>Encontrou uma dificuldade?</h2>
    <p>
      Informe à equipe responsável a página, o dispositivo e o que impediu você de
      continuar. Não afirmamos conformidade integral com normas sem uma auditoria
      independente.
    </p>
  </q-page>
</template>
