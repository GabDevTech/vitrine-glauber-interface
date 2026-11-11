# Modelo de dados

Status: modelo aprovado e representado em `api/prisma/schema.prisma` e nos arquivos por domínio de `api/prisma/models/`. A migration `20261109_initial_schema` e o seed demonstrativo foram aplicados ao PostgreSQL local, cada um após backup. A API expõe o catálogo publicado à vitrine pública; a gestão continua com dados locais.

## Princípios

- PostgreSQL é a fonte de verdade depois da validação do seed inicial.
- Prisma é o ORM oficial para entidades, relações, consultas e migrations. SQL direto permanece permitido quando tecnicamente justificado.
- Todos os instantes são timestamptz em UTC; a interface apresenta America/Bahia.
- Migrations destrutivas, resets ou operações que apaguem dados exigem autorização.
- IDs das entidades de negócio são BIGINT. A API os expõe como texto.
- Slugs são gerados e validados exclusivamente pelo servidor a partir do nome.

## Identificadores e URLs

| Recurso             | Identidade | Identificador público                    |
| ------------------- | ---------- | ---------------------------------------- |
| Box                 | BIGINT     | slug único entre boxes                   |
| Produto             | BIGINT     | slug único entre produtos                |
| Categoria           | BIGINT     | código/slug único entre categorias       |
| Mídia               | BIGINT     | chave aleatória interna de armazenamento |
| Evento de auditoria | BIGINT     | não público                              |
| Sessão              | BIGINT     | token aleatório seguro, salvo como hash  |

Em colisões, o servidor acrescenta sufixos (`nome`, `nome-2`). Boxes e produtos podem usar o mesmo slug porque suas rotas públicas são distintas. Slugs já publicados ficam reservados permanentemente no próprio tipo de recurso, inclusive depois de uma mudança de nome ou arquivamento; não podem ser atribuídos a outro item. Assim, uma URL antiga não passa a abrir um item diferente. Um slug proposto para revisão de trabalho também não pode colidir com o slug público ou reservado de outro item. A revisão histórica conserva seu slug sem exigir unicidade entre todas as linhas de histórico.

## Conteúdo e revisões

As tabelas `boxes` e `products` guardam a identidade estável do item. Os dados editoriais ficam em `box_revisions` e `product_revisions`.

- Cada item possui no máximo uma revisão publicada e uma revisão de trabalho. As revisões anteriores permanecem como histórico interno.
- O item controla a visibilidade pública (`unpublished`, `published` ou `archived`); a revisão de trabalho percorre `draft` → `in_review` → `ready`, podendo voltar a `draft` após devolução. A revisão publicada permanece identificada até ser substituída. Os rótulos correspondentes na gestão são “Rascunho”, “Em revisão”, “Pronto para publicar”, “Publicado” e “Arquivado”.
- A gestão edita apenas a revisão de trabalho. Uma edição de item publicado não o arquiva: a revisão publicada e sua URL continuam na vitrine até a publicação da nova revisão.
- A publicação troca a revisão pública e ativa o slug da nova revisão na mesma transação. Se o slug mudou, o endereço anterior passa a responder `404`, sem redirecionamento.
- Item e revisão possuem controle de versão iniciado em 1; o servidor verifica a versão pertinente antes de editar ou mudar o estado. Divergência retorna `409`.
- O arquivamento oculta o item e os produtos dependentes sem apagar a última revisão publicada. Restaurar exige novo fluxo editorial antes de republicar.

### Box

Cada revisão de box contém nome (2–130), slug proposto, nome do responsável (2–130), número inteiro positivo do box, localização pública (até 180), horário público (até 180), descrição opcional (até 2000), história opcional (até 5000), WhatsApp opcional, capa e retrato opcional do responsável. A capa é obrigatória para publicação; o retrato não é.

Boxes têm uma ou mais categorias, sem categoria principal/secundária. A relação entre categoria e box pertence à revisão. Há uma capa por revisão e, separadamente, no máximo um retrato do responsável. O número do box é único entre identidades de boxes, inclusive arquivados; revisões históricas do mesmo box podem repetir o número. WhatsApp só aparece publicamente se o box estiver publicado e o contato tiver sido explicitamente autorizado.

### Produto

Cada revisão de produto contém nome (2–130), slug proposto, `box_id`, `category_id`, descrição opcional (até 2000), `price_cents` opcional e de uma a cinco mídias. Uma mídia é capa e as demais possuem ordem explícita. O produto pode ser preparado para um box ainda não publicado, mas só é publicado quando o box correspondente está público. Arquivar um box oculta seus produtos da vitrine.

Preço é inteiro em centavos, nunca float, e usa BRL na V1. A apresentação é, por
exemplo, 25,90R$; preço ausente mostra “Consulte o expositor”.

### Categoria

`categories` contém ID `BIGINT`, nome (2–80), código/slug, descrição opcional (até 500), ícone permitido pela interface, tom permitido, `active`, `version`, autoria e datas. Produtos têm uma categoria; boxes podem ter várias. O código existente pode ser preservado no seed mesmo quando difere do slug que seria gerado pelo nome atual; mudanças futuras de nome geram um novo código no servidor. Antes de desativar uma categoria, a gestão deve retirar ou substituir seus vínculos atuais com boxes e produtos. O histórico editorial permanece intacto. Categoria inativa não fica disponível para novos vínculos nem nos filtros públicos. Exclusão física só é possível se não houver nenhum vínculo, inclusive no histórico preservado.

## Mídias

`media` guarda ID `BIGINT`, `storage_key` aleatória, nome original sanitizado, MIME validado, tamanho, largura, altura, tipo, estado, autoria e datas. O arquivo não é salvo no PostgreSQL: durante o desenvolvimento, a API executada no Windows usará a pasta local `api/storage/uploads/`, ignorada pelo Git. O volume Docker atual armazena apenas os dados do PostgreSQL; persistência de uploads por volume será configurada somente se a API vier a ser conteinerizada.

Uploads aceitam JPG, PNG e WebP de até 8 MB, são decodificados, têm metadados
removidos e são convertidos para WebP com lado máximo de 1600 px. Mídia pública é
entregue apenas se estiver ligada a conteúdo publicado; mídia privada exige sessão e
permissão. Mídias órfãs ficam 30 dias, salvo exclusão imediata confirmada por
moderator/admin e sem vínculo restante.

## Contas, papéis e preferências

users contém id, nome de usuário único, nome real, e-mail institucional único, hash
Argon2id, estado, datas e atividade recente. Estados: pending_invitation, active,
blocked, invitation_expired e removed.

roles e user_roles permitem acumular editor, moderator e admin. Preferências vivem
em user_preferences (relação 1:1) e são independentes dos papéis: tema, alto
contraste, tamanho de texto e redução de movimento.

O nome de usuário preserva a capitalização escolhida no aceite do convite. A busca
para login e a restrição de unicidade ignoram maiúsculas e minúsculas.

Contas pendentes recebem convite genérico, sem expor nome real. O aceite confirma o
nome cadastrado, define nome de usuário e senha. Admin não visualiza senhas nem
altera dados de identidade de contas ativas na V1.

O comando `api/prisma/bootstrap-admin.mjs` cria apenas o convite inicial do Admin se
o banco não tiver nenhuma conta. Ele verifica isso antes de solicitar nome, e-mail
ou confirmação e repete a checagem dentro da transação. Uma conta bloqueada ou
marcada como removida ainda ocupa uma linha em `users` e impede novo bootstrap. O
token aleatório é apresentado uma vez, armazenado somente como SHA-256 e expira em
24 horas. O registro pendente da conta e o convite são gravados antes de a pessoa
abrir o link; essa conta não pode autenticar até definir usuário e senha. A página de
aceite exige confirmação do nome real cadastrado e uma etapa de revisão dos dados
antes da confirmação final; a senha nunca é exibida e é armazenada com Argon2id. Após
cinco nomes incorretos no convite do bootstrap, `lockedUntil` registra bloqueio de
dois minutos; depois, as tentativas são restauradas. O aceite ativa a conta e
cria suas preferências sem iniciar a sessão. O reenvio de convite expirado ainda não
tem fluxo próprio.

## Convites, sessões e presença

invitations contém id, conta, hash de token, expiração, uso, revogação, tentativas,
data final do bloqueio e administrador criador. Reenvio revoga o convite anterior.

sessions contém id, conta, hash de token, criação, última atividade, expiração por
inatividade, expiração absoluta, revogação e metadados mínimos pseudonimizados. Uma
conta pode ter várias sessões. O fluxo inicial usa 30 minutos de inatividade e 12
horas de duração absoluta. A presença é calculada a partir da atividade; os rótulos
finais serão definidos durante a configuração da interface.

## Auditoria e notificações

audit_events é imutável: id, autor, ação, tipo e ID do recurso, instante, request_id,
resumo seguro, alterações limitadas e motivo quando aplicável. Não armazena senhas,
tokens, cookies, IP bruto ou conteúdo sensível. Retenção inicial: permanente.

notifications contém destinatário, tipo, título, mensagem, recurso opcional, autor,
criação e leitura. É criada na mesma transação da ação correspondente, não é apagada
ao ser lida e tem retenção inicial de 90 dias.

## Integridade, índices e retenção

- Unicidade case-insensitive para e-mail e nome de usuário.
- Unicidade de slug/código no escopo de seu recurso e de box_number numérico.
- Chaves estrangeiras impedem vínculos quebrados; não haverá cascata silenciosa
  sobre histórico, revisão ou auditoria.
- price_cents >= 0 e version >= 1 são restrições do banco.
- Índices cobrem slugs publicados, estado, relações de categoria, box/produto,
  revisões ativas, sessões válidas, notificações não lidas e auditoria.
- Conteúdo arquivado e auditoria são preservados. Contas removidas minimizam dados
  pessoais onde possível, preservando referência técnica de auditoria.
- Backups locais usam pg_dump, são ignorados pelo Git e mantêm os sete mais recentes.
  Restauração exige confirmação explícita.

O rascunho Prisma usa `BigInt @id @default(autoincrement())` nas identidades principais e mapeia os modelos para tabelas com nomes em `snake_case`. Campos exigidos apenas para publicação permanecem opcionais no banco para permitir rascunhos incompletos. As tabelas `box_slugs` e `product_slugs` reservam permanentemente endereços já publicados; a unicidade do slug público e a troca de revisões devem ocorrer em transação.

A primeira migration inclui índices de unicidade sem distinção entre maiúsculas/minúsculas para e-mail e usuário; índices parciais que limitam a uma revisão publicada e uma de trabalho por item; restrições `CHECK` para versões, números de box e preço; limite de uma capa por revisão de produto; e gatilhos que impedem edição, exclusão e truncamento da auditoria. Regras que dependem de várias tabelas, como requisitos de publicação, estado do box responsável, categorias ativas, reserva de slugs entre tabelas e limite de cinco imagens, ainda exigem validação transacional na API. Os modelos Prisma e a migration são a estrutura do banco; os registros demonstrativos foram criados pelo seed autorizado separadamente.

## Seed e importação do catálogo atual

O catálogo estático em `src/data/catalog.js` será a fonte do seed inicial. O seed é idempotente em desenvolvimento: preserva relações, não cria duplicatas e nunca sobrescreve alterações de gestão. Ele recusa execução em produção. Os IDs do catálogo servem apenas para mapear as relações; o PostgreSQL gera os novos IDs `BIGINT`.

Na conversão, o filtro virtual `todos` não vira categoria no banco. Os códigos atuais das categorias são preservados, inclusive `alimentacao`, cujo rótulo é “Sabores da terra”. Números apresentados como `Box 08` são interpretados como o inteiro `8`; preços em reais são convertidos exatamente para centavos. As imagens ilustrativas atuais de boxes tornam-se capas de box, nunca retratos de pessoas. O seed deve localizar os arquivos de imagem existentes, validar vínculos e conferir contagens antes de habilitar o catálogo pela API.

Para manter a vitrine como está, o seed cria uma revisão publicada para cada um dos 5 boxes e 8 produtos do catálogo estático. Além disso, cria revisões de trabalho demonstrativas para Barro da Serra (`in_review`), Sabores do Sertão (`draft`), Vaso Horizonte (`in_review`) e Bolsa Caminhos (`ready`), conforme `gestao/src/data/editorialStatus.js`. Essas quatro revisões de trabalho começam com os mesmos dados das respectivas revisões publicadas; não representam edições reais nem recebem autoria humana fictícia. A API pública continua exibindo a revisão publicada, inclusive quando houver uma revisão de trabalho.

O IndexedDB da gestão não é apagado nem migrado automaticamente. Uma importação futura será explícita, autenticada, validada, com prévia e confirmação; imagens em Data URL serão convertidas para o armazenamento de mídia.

O script `api/prisma/seed.mjs` confere os quatro códigos reais de categoria, os cinco boxes, os oito produtos, as quatro revisões de trabalho e os arquivos de imagem antes de qualquer gravação. O filtro virtual `todos` fica fora do banco. Na execução autorizada, cada item novo recebeu ID `BIGINT` do PostgreSQL; as relações usam um mapa dos IDs originais para os novos IDs, sem depender da sequência gerada. As imagens ilustrativas foram convertidas para WebP sem metadados, com dimensão máxima de 1600 px, e armazenadas por chave aleatória em `api/storage/uploads/`; a capa de box não foi tratada como retrato. O seed criou também os três códigos de papel, sem contas, senhas ou autoria humana fictícia. Uma nova execução localiza itens já publicados por suas reservas de slug e preserva seus dados; se algum código ou slug esperado não estiver mais presente em um catálogo que já contém dados, ela falha sem recriar registros. O seed não é disparado por migration. A conferência encontrou 5 revisões publicadas de box, 8 de produto, 4 revisões de trabalho, 13 mídias e nenhum usuário.
