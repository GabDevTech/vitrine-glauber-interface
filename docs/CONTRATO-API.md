# Contrato da API

Status: contrato em implementação. `GET /api/v1/health` já responde com a disponibilidade da API e do PostgreSQL; as demais rotas ainda não foram implementadas.

## Objetivo e convenções

A API separará a vitrine pública da gestão. A base será `/api/v1`: o versionamento vale para chamadas entre frontends e servidor; as URLs públicas continuam como `/boxes/:slug` e `/produtos/:slug`.

- JSON em UTF-8; instantes em ISO 8601/UTC.
- IDs `BIGINT` são enviados como texto (`"42"`) para preservar precisão no JavaScript.
- Respostas bem-sucedidas usam `data`; listagens usam também `meta` com `page`, `perPage`, `total` e `totalPages`.
- Paginação começa em 1, padrão 20 e máximo 100.
- Busca normaliza maiúsculas, acentos e espaços. PATCH altera parcialmente; não haverá PUT.

## Erros

~~~
{
  "statusCode": 422,
  "code": "VALIDATION_ERROR",
  "message": "Confira os dados informados.",
  "details": { "name": ["Informe entre 2 e 130 caracteres."] },
  "requestId": "req_..."
}
~~~

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

~~~
GET /api/v1/health
GET /api/v1/categories
GET /api/v1/boxes
GET /api/v1/boxes/:slug
GET /api/v1/products
GET /api/v1/products/:slug
GET /api/v1/media/:id
~~~

`GET /api/v1/health` responde `200` com `{ "data": { "status": "ok", "database": "ok" } }` quando a consulta ao banco funciona. Se a consulta falhar, responde `503` com `code: "SERVICE_UNAVAILABLE"`, mensagem genérica e `requestId`, sem expor detalhes da conexão. A rota não lê nem modifica registros do catálogo.

As rotas públicas de catálogo e mídia não exigirão autenticação e retornarão somente revisões publicadas, categorias ativas e mídias públicas. Boxes poderão filtrar por qualquer categoria vinculada; produtos filtrarão por categoria e box. Busca de box considera nome, responsável, número e categorias; busca de produto considera nome, box e categoria. Produtos sem preço ficam no fim das ordenações por preço.

O detalhe público usa sempre o slug da revisão publicada atual. Durante uma edição, nome e slug propostos ficam privados. Se a publicação mudar o slug, a rota antiga retorna `404`, sem redirecionamento; um slug publicado anteriormente não pode ser reutilizado por outro conteúdo. Mídias só são públicas enquanto o conteúdo relacionado estiver visível na vitrine: produtos de box arquivado também perdem o acesso público às imagens. A mídia pública de box pode ser a capa e, se houver, o retrato do responsável; a API nunca apresenta a capa ilustrativa como retrato.

## Autenticação e convite

~~~
GET  /api/v1/auth/csrf
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
POST /api/v1/auth/invitations/accept
~~~

Login aceita e-mail ou nome de usuário. O aceite recebe token, confirmação do nome real, nome de usuário e primeira senha. O token do convite não é devolvido por uma rota de consulta nem salvo em texto puro. Tanto login quanto aceite exigem CSRF, limitação de tentativas e verificação de origem; a consulta pública do catálogo não envia cookies.

## Gestão editorial

Todas as rotas de gestão exigem sessão e permissão; `POST`, `PATCH` e `DELETE` também exigem CSRF. `editor` cria, edita e envia revisões. `moderator` pode consultar todos os registros editoriais, criar e alterar conteúdo, aprovar, devolver com comentário, publicar e arquivar, inclusive revisões próprias. `admin` acumula essas permissões e administra contas, papéis e categorias. Uma pessoa pode acumular papéis; alterações de papel preservam suas preferências.

~~~
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
~~~

As mesmas rotas existem sob `/api/v1/management/products`. Consulta, criação, edição e envio à revisão são permitidos a `editor`, `moderator` e `admin`; aprovação, devolução, publicação, arquivamento e restauração exigem `moderator` ou `admin`. A edição envia a `version` pertinente; conflitos retornam `409`. Devolução exige comentário de 5 a 1000 caracteres. O conteúdo publicado segue visível enquanto sua revisão de trabalho é editada; `restore` não republica sozinho.

## Categorias, mídias e conta própria

~~~
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
~~~

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
