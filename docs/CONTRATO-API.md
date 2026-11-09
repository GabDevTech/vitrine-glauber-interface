# Contrato da API

Status: planejamento aprovado. Nenhuma rota está implementada ainda.

## Objetivo e convenções

A API separará a vitrine pública da gestão. A base será /api/v1: o versionamento vale
para chamadas entre frontends e servidor; as URLs públicas continuam como
/boxes/:slug e /produtos/:slug.

- JSON em UTF-8; instantes em ISO 8601/UTC.
- IDs BIGINT são enviados como texto ("42") para preservar precisão no JavaScript.
- Respostas usam data; listagens usam também meta com page, perPage, total e totalPages.
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
- GET /api/v1/auth/csrf fornece o token exigido em mutações autenticadas.
- CORS local aceita credenciais apenas de http://localhost:4180 e
  http://localhost:4175. Produção usa origens explícitas, nunca *.
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

Elas não exigem autenticação e retornam somente revisões publicadas, categorias
ativas e mídias públicas. Boxes podem filtrar por qualquer categoria vinculada;
produtos filtram por categoria e box. Busca de box considera nome, responsável,
número e categorias; busca de produto considera nome, box e categoria. Produtos sem
preço ficam no fim das ordenações por preço.

## Autenticação e convite

~~~
GET  /api/v1/auth/csrf
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
POST /api/v1/auth/invitations/accept
~~~

Login aceita e-mail ou nome de usuário. O aceite recebe token, confirmação do nome
real, nome de usuário e primeira senha. O token nunca é devolvido pela API ou salvo
em texto puro.

## Gestão editorial

Todas as rotas exigem sessão, CSRF e permissão. editor cria, edita e envia
revisões; moderator e admin também aprovam, publicam e arquivam, inclusive conteúdo próprio.

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

As mesmas rotas existem sob /management/products. Edição envia version e conflitos
retornam 409. Devolução exige comentário. O conteúdo publicado segue visível enquanto
sua revisão de trabalho é editada; restore não republica sozinho.

## Categorias, mídias e conta própria

~~~
GET/POST/PATCH /api/v1/management/categories[/:id]
POST /api/v1/management/categories/:id/deactivate
POST /api/v1/management/categories/:id/activate
DELETE /api/v1/management/categories/:id

POST   /api/v1/management/media
GET    /api/v1/management/media/:id
POST   /api/v1/management/media/:id/unlink
DELETE /api/v1/management/media/:id

GET/PATCH /api/v1/management/me/preferences
POST      /api/v1/management/me/change-password
GET       /api/v1/management/notifications
POST      /api/v1/management/notifications/:id/read
~~~

Somente admin administra categorias. Upload aceita JPG, PNG e WebP de até 8 MB,
valida o arquivo, remove metadados e gera WebP de até 1600 px. Moderator/admin pode
excluir mídia imediatamente com confirmação e auditoria.

## Administração e observabilidade

Admin usa GET/POST /management/users, GET /management/users/:id,
PATCH /management/users/:id/roles, ações de bloquear, desbloquear, reenviar ou
cancelar convite, redefinir senha e DELETE /management/users/:id. Também consulta
GET /management/audit-events e GET /management/users/:id/presence.

Admin não visualiza senhas nem altera identidade de contas ativas. A API registra
requestId, rota, status e duração sem segredos. Limites iniciais: login/convite,
5 tentativas em 15 minutos; gestão, 120 requisições/minuto; catálogo, 300/minuto.
Swagger/OpenAPI existe apenas em desenvolvimento, em /api/docs.
