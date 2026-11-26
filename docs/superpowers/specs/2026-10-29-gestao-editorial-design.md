# Gestão editorial e fotografias

Pedido aprovado: implementar os achados da análise e permitir fotos de produtos e foto opcional do responsável pelo box. Toda publicação exige revisão.

Manter Vue 3, Pinia, Quasar e identidade atual. Corrigir categorias, proteger alterações não salvas, tornar fluxo editorial explícito, priorizar pendências no painel mobile, mostrar preços, melhorar legibilidade e nomes acessíveis. Adicionar filtro de box.

Fluxo: salvar rascunho ou enviar à revisão; na revisão conferir e aprovar; somente registros aprovados podem ser publicados. Editar qualquer conteúdo aprovado/publicado invalida a aprovação e volta a rascunho ou revisão. Status não é um campo livre. Dados antigos publicados continuam publicados até serem alterados.

Fotos: galeria de até 5 fotos por produto e um retrato opcional do responsável pelo box; JPG/PNG/WebP até 8 MB cada, arquivos decodificados e reduzidos localmente, prévia, remover e escolher capa. Fotos obrigatórias para enviar produto novo sem imagem à revisão; rascunhos podem estar incompletos. Evitar SVG e URLs blob persistidas. Mostrar limites e erros junto ao controle.

O projeto não tem backend. A implementação usará IndexedDB local para cadastros/fotos, sem simular upload remoto. Dados sobrevivem ao recarregamento no navegador atual. Falha de armazenamento deve impedir sucesso enganoso e manter formulário aberto. Não alterar catálogo público nem criar autenticação/serviço remoto.

Abordagens: manter tudo somente em memória perderia fotos no reload; montar backend exigiria infraestrutura não existente. Decisão de implementação: armazenamento local durável com serviço isolado, preparado para integração posterior.

Validação: testes de regras/transições, proteção de descarte, persistência de foto e edição, categoria e preço, revisão obrigatória, inspeção desktop/mobile e build.
