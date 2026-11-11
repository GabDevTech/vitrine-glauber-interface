# Contrato da API

Status: a rota de saúde, as rotas públicas de consulta ao catálogo e o primeiro fluxo de autenticação da gestão estão implementados. A gestão ainda mantém boxes, produtos e mídias no armazenamento local do navegador; as rotas editoriais e administrativas seguem pendentes.

## Objetivo e convenções

A API separará a vitrine pública da gestão. A base será `/api/v1`: o versionamento vale para chamadas entre frontends e servidor; as URLs públicas continuam como `/boxes/:slug` e `/produtos/:slug`.

- JSON em UTF-8; instantes em ISO 8601/UTC.
- IDs `BIGINT` são enviados como texto (`"42"`) para preservar precisão no JavaScript.
- Respostas bem-sucedidas usam `data`; listagens usam também `meta` com `page`, `perPage`, `total` e `totalPages`.
- Paginação começa em 1, padrão 20 e máximo 100.
- Busca normaliza maiúsculas, acentos e espaços. PATCH altera parcialmente; não haverá PUT.

## Erros

```
{
  "statusCode": 422,
  "code": "VALIDATION_ERROR",
  "message": "Confira os dados informados.",
  "details": { "name": ["Informe entre 2 e 130 caracteres."] },
  "requestId": "req_..."
}
```

Os códigos técnicos são estáveis e em inglês; mensagens para a interface são em
português. A API usa, no mínimo, 400, 401, 403, 404, 409, 422, 429 e 500.
Slug antigo retorna 404; não existe redirecionamento.

## Sessão e segurança

- Sessão por cookie HttpOnly, com token aleatório seguro e hash armazenado no
  PostgreSQL. Senhas usam somente Argon2id.
- Cookies usam Secure em produção, SameSite apropriado, Path=/ e expiração.
  Em HTTP local, Secure pode ser desligado apenas por ambiente.
- Inatividade expira em 30 minutos; a duração máxima contínua é 12 horas.
- Logout, troca de senha, bloqueio, remoção ou remoção de todos os papéis revogam
  as sessões necessárias no servidor.
- `GET /api/v1/auth/csrf` fornece proteção para login, aceite de convite e mutações autenticadas. Essas operações exigem token CSRF em `X-CSRF-Token` e validação da origem. A entrega do token antes do login deve ser vinculada de forma segura ao navegador, sem disponibilizar um segredo de sessão administrativa.
- A vitrine em `http://localhost:4180` consulta apenas rotas públicas sem credenciais. A gestão em `http://localhost:4175` pode enviar o cookie de sessão; a API só aceita essa origem explicitamente para operações com credenciais. Origens de produção serão configuradas por ambiente, nunca com `*` para credenciais.
- Logs não registram senhas, tokens, cookies ou chaves de armazenamento.

## Rotas públicas

```
GET /api/v1/health
GET /api/v1/categories
GET /api/v1/boxes
GET /api/v1/boxes/:slug
GET /api/v1/products
GET /api/v1/products/:slug
GET /api/v1/media/:id
```

`GET /api/v1/health` responde `200` com `{ "data": { "status": "ok", "database": "ok" } }` quando a consulta ao banco funciona. Se a consulta falhar, responde `503` com `code: "SERVICE_UNAVAILABLE"`, mensagem genérica e `requestId`, sem expor detalhes da conexão. A rota não lê nem modifica registros do catálogo.

As rotas públicas de catálogo e mídia não exigem autenticação e retornam somente revisões publicadas, categorias ativas e mídias públicas. As listas aceitam `page` e `perPage` (padrões 1 e 20, máximo 100 por página). Boxes e produtos aceitam `q`, `category` (código da categoria) e `sort`; produtos também aceitam `box` (slug atual do box). `sort=featured` mantém a ordem estável de ID; `sort=name` usa o nome em português; produtos também aceitam `price_asc` e `price_desc`, sempre deixando preços ausentes por último. Parâmetros inválidos retornam `400` com `code: "INVALID_QUERY"`.

A busca ignora diferenças entre maiúsculas, minúsculas e acentos. Em boxes, considera nome, responsável, número e categorias ativas; em produtos, nome, box e categoria. Os filtros são aplicados aos registros publicados antes da paginação. Nesta primeira versão, a aplicação filtra e ordena os registros publicados em memória, adequado ao catálogo demonstrativo atual; quando o volume crescer, essas operações precisarão ser transferidas para consultas e índices do banco.

Na integração atual, a vitrine solicita todas as páginas públicas de categorias, boxes e produtos, com 100 itens por página, e aplica os filtros da URL no navegador. O serviço limita a carga a 100 páginas por recurso e apresenta erro com nova tentativa quando a API falha. As chamadas e as URLs de mídia usam `/api/v1` na mesma origem: Vite faz o encaminhamento local, e a hospedagem de produção deverá oferecer encaminhamento equivalente. A vitrine não envia cookies nessas consultas.

As listas retornam `{ "data": [...], "meta": { "page": 1, "perPage": 20, "total": 5, "totalPages": 1 } }`; os detalhes retornam `{ "data": {...} }`. IDs `BIGINT` são textos, `priceCents` permanece inteiro ou `null`, e as referências de mídia contêm ID e caminho `/api/v1/media/:id`. O WhatsApp de um box só aparece quando seu contato público foi autorizado. O endpoint de mídia entrega `image/webp` com `Cache-Control: no-store`, após conferir que o arquivo está vinculado à revisão publicada de um item visível; mídia privada, removida ou ligada apenas a conteúdo arquivado retorna `404`.

O detalhe público usa sempre o slug da revisão publicada atual. Durante uma edição, nome e slug propostos ficam privados. Se a publicação mudar o slug, a rota antiga retorna `404`, sem redirecionamento; um slug publicado anteriormente não pode ser reutilizado por outro conteúdo. Mídias só são públicas enquanto o conteúdo relacionado estiver visível na vitrine: produtos de box arquivado também perdem o acesso público às imagens. A mídia pública de box pode ser a capa e, se houver, o retrato do responsável; a API nunca apresenta a capa ilustrativa como retrato.

## Autenticação e convite

```
GET  /api/v1/auth/csrf
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
POST /api/v1/auth/invitations/accept
```

O primeiro Admin é criado pelo comando interativo `npm run admin:bootstrap`, executado em `api/`. Antes de pedir nome, e-mail ou confirmação, o comando consulta se existe alguma conta; se encontrar uma única conta Admin pendente, sem nome de usuário e senha, informa que outra execução do bootstrap provavelmente criou o convite primeiro e que não foi criada uma segunda conta. Nos demais casos com contas existentes, encerra com a mensagem de conta já configurada. Se o banco estiver sem contas, pede nome real completo e e-mail, exige a confirmação literal `CRIAR ADMIN` e cria uma conta pendente com papel `admin`. Repete a verificação dentro da transação antes de gravar para evitar uma criação concorrente. Exibe uma única vez um link de uso único, válido por 24 horas; não envia e-mail nem grava o token em texto puro. Em produção, `MANAGEMENT_ORIGIN` precisa ser HTTPS. Para executar um novo bootstrap, todas as contas precisam ter sido permanentemente removidas e não pode restar nenhuma linha em `users`; marcar uma conta como bloqueada ou removida não basta. O reenvio de um convite pendente ou expirado ainda não tem fluxo próprio.

O convite abre a página separada `/gestao/convite/aceitar`. A pessoa informa o nome real, nome de usuário e senha; antes do envio, uma etapa de revisão pede confirmação dos dados e nunca exibe a senha. O token fica no fragmento da URL e é removido do endereço pelo navegador antes da submissão; enquanto o convite está em uso, a página mantém o token somente no `sessionStorage` da mesma aba para sobreviver a uma atualização durante o bloqueio. Convites do bootstrap expiram em 24 horas. Cinco nomes incorretos bloqueiam novas tentativas por 2 minutos; a página mostra a contagem regressiva e, ao fim, recupera as cinco tentativas. Convites emitidos futuramente por um Admin terão política própria. Aceitar o convite não autentica automaticamente: ao concluir, a página segue para `/gestao/login`, onde a pessoa entra com e-mail ou nome de usuário e a senha recém-criada.

O aceite valida separadamente nome real (2 a 130 caracteres), nome de usuário (3 a 30 caracteres, conforme o padrão definido) e senha (8 a 130 caracteres). A divergência entre senha e confirmação é detectada na página antes da chamada à API. A API diferencia nome inválido, divergência com o nome registrado, nome de usuário indisponível, senha inválida, convite expirado, convite inválido/usado/revogado, bloqueio de tentativas, falha CSRF e origem não autorizada. Erros de servidor ou indisponibilidade da API são apresentados como falha temporária, sem atribuí-los ao token.

Login cria uma sessão com token aleatório em cookie `HttpOnly`; somente o hash do token fica no PostgreSQL. A sessão expira após 30 minutos sem atividade ou 12 horas no total. O cookie usa `SameSite=Lax`, `Path=/api/v1` e `Secure` em produção. `GET /auth/me` valida a sessão e renova sua expiração por inatividade. Logout revoga a sessão no banco e limpa o cookie. Senhas são verificadas com Argon2id.

O nome de usuário é armazenado e exibido preservando as maiúsculas e minúsculas escolhidas no convite. Login e unicidade continuam sem distinção entre maiúsculas e minúsculas; por exemplo, `GlauberAdmin` e `glauberadmin` identificam o mesmo nome.

Login, logout e aceite exigem `X-CSRF-Token`, cookie CSRF correspondente e a origem exata configurada em `MANAGEMENT_ORIGIN`; em desenvolvimento, a origem padrão é `http://localhost:4175`. O login permite seis falhas por endereço IP; após a sexta, bloqueia novas tentativas por 10 minutos e então restaura as seis. Esse controle é mantido em memória do processo, portanto produção com várias instâncias exige armazenamento compartilhado. A política de convite do bootstrap é controlada por convite no PostgreSQL; falhas de nome não são somadas ao bloqueio de login. A consulta pública do catálogo não envia cookies. O painel editorial permanece demonstrativo/local até a implementação das rotas de gestão.

## Gestão editorial

Todas as rotas de gestão exigem sessão e permissão; `POST`, `PATCH` e `DELETE` também exigem CSRF. `editor` cria, edita e envia revisões. `moderator` pode consultar todos os registros editoriais, criar e alterar conteúdo, aprovar, devolver com comentário, publicar e arquivar, inclusive revisões próprias. `admin` acumula essas permissões e administra contas, papéis e categorias. Uma pessoa pode acumular papéis; alterações de papel preservam suas preferências.

```
GET   /api/v1/management/boxes
POST  /api/v1/management/boxes
GET   /api/v1/management/boxes/:id
PATCH /api/v1/management/boxes/:id/revision
POST  /api/v1/management/boxes/:id/submit-review
POST  /api/v1/management/boxes/:id/approve
POST  /api/v1/management/boxes/:id/return
POST  /api/v1/management/boxes/:id/publish
POST  /api/v1/management/boxes/:id/archive
POST  /api/v1/management/boxes/:id/restore
```

As mesmas rotas existem sob `/api/v1/management/products`. Consulta, criação, edição e envio à revisão são permitidos a `editor`, `moderator` e `admin`; aprovação, devolução, publicação, arquivamento e restauração exigem `moderator` ou `admin`. A edição envia a `version` pertinente; conflitos retornam `409`. Devolução exige comentário de 5 a 1000 caracteres. O conteúdo publicado segue visível enquanto sua revisão de trabalho é editada; `restore` não republica sozinho.

## Categorias, mídias e conta própria

```
GET    /api/v1/management/categories
POST   /api/v1/management/categories
PATCH  /api/v1/management/categories/:id
POST   /api/v1/management/categories/:id/deactivate
POST   /api/v1/management/categories/:id/activate
DELETE /api/v1/management/categories/:id

POST   /api/v1/management/media
GET    /api/v1/management/media/:id
POST   /api/v1/management/media/:id/unlink
DELETE /api/v1/management/media/:id

GET   /api/v1/management/me/preferences
PATCH /api/v1/management/me/preferences
POST  /api/v1/management/me/change-password
GET   /api/v1/management/notifications
POST  /api/v1/management/notifications/:id/read
```

Somente `admin` administra categorias. Desativar exige retirar ou substituir seus vínculos editoriais atuais; excluir exige ausência de vínculos preservados. `editor`, `moderator` e `admin` podem enviar e consultar mídia de conteúdo editorial autorizado. `editor` pode desvincular mídia de uma revisão de trabalho; `moderator` e `admin` também podem excluir mídia definitivamente, sem vínculos restantes, com confirmação e auditoria. Upload aceita JPG, PNG e WebP de até 8 MB, valida o arquivo, remove metadados e gera WebP de até 1600 px. A revisão de box exige capa para publicação e pode ter retrato opcional; a revisão de produto exige de uma a cinco imagens.

## Administração e observabilidade

```text
GET    /api/v1/management/users
POST   /api/v1/management/users
GET    /api/v1/management/users/:id
PATCH  /api/v1/management/users/:id/roles
POST   /api/v1/management/users/:id/block
POST   /api/v1/management/users/:id/unblock
POST   /api/v1/management/users/:id/resend-invitation
POST   /api/v1/management/users/:id/cancel-invitation
POST   /api/v1/management/users/:id/reset-password
DELETE /api/v1/management/users/:id
GET    /api/v1/management/audit-events
GET    /api/v1/management/users/:id/presence
```

Todas essas rotas são exclusivas de `admin`. Administradores não visualizam senhas nem alteram a identidade de contas ativas. `PATCH .../roles` altera somente permissões e mantém preferências. A API registra `requestId`, rota, status e duração sem segredos. Limites iniciais: login e convite, 5 tentativas em 15 minutos; gestão, 120 requisições/minuto; catálogo, 300/minuto. Swagger/OpenAPI existirá apenas em desenvolvimento, em `/api/docs`.
