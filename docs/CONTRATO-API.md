# Contrato inicial da API

Status: proposta para revisão. Nenhum endpoint está implementado ainda.

## 1. Objetivo

A API deverá separar a vitrine pública da área administrativa. A vitrine consulta
conteúdo publicado sem exigir login. A gestão usa sessões tradicionais por cookie
HttpOnly e aplica autorização no servidor para cada operação editorial.

Base sugerida:

```text
/api/v1
```

Formato padrão: JSON em UTF-8. Datas e horários devem usar ISO 8601 em UTC.
Valores monetários devem ser representados como centavos inteiros ou como campos
decimalmente definidos no contrato; a escolha final deve ser mantida de forma
consistente em toda a API. Esta proposta usa `priceCents` nas respostas.

## 2. Resposta de erro

Todas as falhas devem seguir um formato previsível:

```json
{
  "statusCode": 422,
  "code": "VALIDATION_ERROR",
  "message": "Confira os dados informados.",
  "details": {
    "name": ["Use um nome com 2 a 80 caracteres."]
  },
  "requestId": "req_01..."
}
```

Códigos mínimos:

| HTTP | Código | Uso |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | Requisição malformada |
| 401 | `UNAUTHENTICATED` | Sessão ausente ou expirada |
| 403 | `FORBIDDEN` | Usuário sem permissão |
| 404 | `NOT_FOUND` | Registro inexistente ou não visível |
| 409 | `CONFLICT` | Conflito de versão ou transição inválida |
| 422 | `VALIDATION_ERROR` | Campos inválidos |
| 429 | `RATE_LIMITED` | Limite de requisições excedido |
| 500 | `INTERNAL_ERROR` | Falha inesperada |

## 3. Endpoints públicos

### Categorias

```text
GET /api/v1/categories
```

Retorna somente categorias ativas e utilizáveis na vitrine.

### Boxes publicados

```text
GET /api/v1/boxes?q=&category=&page=&limit=
GET /api/v1/boxes/:slug
```

Somente boxes publicados devem aparecer. A busca deve ignorar maiúsculas,
acentos e espaços extras, preservando o comportamento atual do front.

Resposta resumida:

```json
{
  "items": [
    {
      "id": 1,
      "slug": "barro-da-serra",
      "name": "Barro da Serra",
      "owner": "Célia Andrade",
      "number": "Box 14",
      "category": { "id": "artesanato", "label": "Artesanato" },
      "description": "...",
      "story": "...",
      "images": [{ "url": "https://...", "alt": "...", "position": 0 }],
      "hours": "...",
      "location": "..."
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "pages": 1 }
}
```

### Produtos publicados

```text
GET /api/v1/products?q=&category=&boxId=&sort=&page=&limit=
GET /api/v1/products/:slug
```

Somente produtos publicados e vinculados a um box publicado devem aparecer.
O detalhe pode incluir o box responsável para preservar a navegação atual.

### Saúde pública

```text
GET /api/v1/health
```

Endpoint técnico sem informações sensíveis, destinado a monitoramento básico.

## 4. Sessão e identidade

### Login

```text
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "equipe@vitrine.test",
  "password": "..."
}
```

Em sucesso, o servidor cria uma sessão e envia um cookie de sessão. O corpo não
deve devolver tokens reutilizáveis para JavaScript.

```json
{
  "user": {
    "id": "usr_01...",
    "name": "Equipe editorial",
    "email": "equipe@vitrine.test",
    "roles": ["editor"]
  }
}
```

### Sessão atual

```text
GET /api/v1/auth/me
```

Retorna o usuário autenticado ou `401 UNAUTHENTICATED`.

### Logout

```text
POST /api/v1/auth/logout
```

Invalida a sessão no servidor e expira o cookie no navegador. Deve exigir CSRF válido, como as demais operações que alteram estado.

## 5. Gestão editorial

Todos os endpoints abaixo exigem sessão autenticada, CSRF válido e permissão
compatível com a operação.

### Consulta administrativa

```text
GET /api/v1/management/boxes?status=&q=&category=&page=&limit=
GET /api/v1/management/products?status=&q=&category=&boxId=&page=&limit=
GET /api/v1/management/reviews?status=&page=&limit=
GET /api/v1/management/categories
```

Ao contrário da vitrine pública, a gestão pode consultar rascunhos, revisões e
publicados, conforme a permissão do usuário.

### Criar e editar

```text
POST  /api/v1/management/boxes
PATCH /api/v1/management/boxes/:id
POST  /api/v1/management/products
PATCH /api/v1/management/products/:id
```

O corpo deve aceitar apenas campos editáveis. `id`, `slug`, status, auditoria e
datas não devem ser definidos livremente pelo cliente.

As alterações devem aceitar `version` ou `If-Match` para evitar sobrescrever uma
edição feita em outra aba ou por outra pessoa.

### Transições editoriais

```text
POST /api/v1/management/:kind/:id/submit-review
POST /api/v1/management/:kind/:id/approve
POST /api/v1/management/:kind/:id/publish
POST /api/v1/management/:kind/:id/archive
```

Estados permitidos:

```text
rascunho → em-revisao → pronto → publicado
                         └──────→ rascunho, quando rejeitado ou reaberto
publicado → arquivado
```

Cada transição deve validar o estado atual no servidor, registrar auditoria e
retornar o registro atualizado. Editar um registro `pronto` ou `publicado` deve
invalidar a aprovação anterior e exigir nova revisão, conforme a regra atual do
front.

### Upload de imagens

Proposta inicial:

```text
POST   /api/v1/management/uploads
DELETE /api/v1/management/uploads/:id
```

O servidor deve validar MIME real, extensão, tamanho, dimensões e quantidade de
imagens. O armazenamento físico pode ser S3-compatible ou outro serviço próprio;
PostgreSQL deve guardar metadados, não arquivos binários grandes.

## 6. Paginação, filtros e cache

- `page` começa em 1 e `limit` deve possuir teto definido pelo servidor.
- Filtros devem ser validados e normalizados no backend.
- A API pública pode usar `ETag` e `Cache-Control` para conteúdo publicado.
- Respostas administrativas não devem ser cacheadas por proxies públicos.
- O servidor deve devolver `requestId` para facilitar diagnóstico.

## 7. Segurança obrigatória

### Cookie de sessão

O cookie deve ser configurado com:

```text
HttpOnly: true
Secure: true em produção
SameSite: Lax ou Strict, conforme o domínio final
Path: /
Max-Age/Expires: definido por política de sessão
```

Em desenvolvimento local, `Secure` pode ser desativado somente quando a aplicação
estiver em HTTP local. Isso deve ser controlado por ambiente, nunca por valor
fixo no código.

### CSRF

Como a autenticação usa cookie, requisições que alteram estado (`POST`, `PATCH`,
`PUT`, `DELETE`) devem exigir proteção contra CSRF. A estratégia preferida é cookie `SameSite` combinado com token CSRF enviado em header, por exemplo:

```text
X-CSRF-Token: <token fornecido pelo servidor>
```

O token não deve ser aceito somente no corpo da requisição. O backend deve validar:
origem, método, token e sessão antes de executar a operação.

### Sessões

- O cookie contém apenas um identificador aleatório, sem dados do usuário.
- O identificador deve ser gerado com fonte criptograficamente segura.
- A sessão deve ser armazenada no servidor, preferencialmente em Redis ou banco dedicado, com PostgreSQL como alternativa inicial de menor escala.
- A senha deve ser armazenada somente como hash forte, como Argon2id ou bcrypt.
- Login deve possuir limitação de tentativas e resposta genérica para credenciais inválidas.
- Logout deve invalidar a sessão no servidor, não apenas apagar o cookie.
- Alteração de privilégio e login devem regenerar o identificador da sessão.
- Sessões devem expirar por inatividade e por tempo máximo absoluto.
- Deve existir revogação de todas as sessões do usuário em caso de incidente.

### Dados e operação

- CORS deve permitir somente origens explicitamente configuradas.
- Não usar `Access-Control-Allow-Origin: *` com credenciais.
- Validar e autorizar novamente no backend, mesmo que o front valide campos.
- Sanitizar conteúdo textual antes de renderizar ou gerar exportações.
- Não registrar senhas, cookies, tokens ou imagens sensíveis nos logs.
- Usar HTTPS fora do ambiente local.
- Aplicar limites de tamanho, rate limit e proteção contra upload abusivo.
- Manter migrações, backups e política de retenção documentados.

## 8. Compatibilidade esperada com o front

O cliente Vue deverá, em etapa posterior:

- substituir `catalogService` local por cliente HTTP;
- enviar credenciais com `credentials: 'include'`;
- obter e enviar o token CSRF antes de mutações;
- tratar `401`, `403`, `409`, `422` e indisponibilidade da API;
- deixar IndexedDB como cache/fallback somente se essa decisão for aprovada;
- remover o login demonstrativo e o `sessionStorage` da autenticação real.

Essas alterações ficam fora desta etapa de documentação.
