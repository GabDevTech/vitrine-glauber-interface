# Modelo inicial de dados

Status: proposta para revisão. Este documento não cria tabelas nem migrações.

## 1. Princípios

- PostgreSQL será a fonte de verdade para conteúdo, usuários e estados editoriais.
- IDs internos devem ser estáveis e não depender do slug.
- Slugs são identificadores públicos legíveis e devem ser únicos por recurso.
- Conteúdo público é definido pelo status `publicado` e por registros ativos.
- Imagens ficam em armazenamento de objetos; o banco guarda URL, metadados e ordem.
- Toda mudança editorial relevante deve deixar registro de auditoria.
- Valores monetários devem usar `integer` em centavos (`price_cents`), evitando problemas de arredondamento com ponto flutuante.

## 2. Entidades principais

### `users`

| Campo | Tipo sugerido | Regras |
| --- | --- | --- |
| `id` | uuid | PK |
| `name` | varchar(120) | obrigatório |
| `email` | citext | obrigatório, único |
| `password_hash` | text | obrigatório, nunca exposto |
| `status` | enum | `active`, `blocked`, `invited` |
| `created_at` | timestamptz | obrigatório |
| `updated_at` | timestamptz | obrigatório |
| `last_login_at` | timestamptz | opcional |

### `roles`

| Campo | Tipo sugerido | Regras |
| --- | --- | --- |
| `id` | uuid | PK |
| `name` | varchar(40) | único |
| `description` | text | opcional |

### `user_roles`

Tabela de relação entre usuários e funções. Deve possuir chave única composta por
`user_id` e `role_id`.

Funções iniciais sugeridas:

| Função | Responsabilidade |
| --- | --- |
| `viewer` | Consultar a gestão, sem editar |
| `editor` | Criar e editar rascunhos, enviar para revisão |
| `reviewer` | Aprovar ou rejeitar revisões |
| `publisher` | Publicar e arquivar conteúdo aprovado |
| `admin` | Usuários, funções e configurações administrativas |

Uma mesma pessoa pode ter mais de uma função.

### `categories`

| Campo | Tipo sugerido | Regras |
| --- | --- | --- |
| `id` | varchar(40) | PK estável, como `artesanato` |
| `label` | varchar(80) | obrigatório |
| `icon` | varchar(80) | opcional |
| `tone` | varchar(30) | opcional |
| `description` | varchar(240) | opcional |
| `active` | boolean | padrão `true` |
| `position` | integer | ordenação |
| `created_at` | timestamptz | obrigatório |
| `updated_at` | timestamptz | obrigatório |

Não criar a categoria pública `todos` no banco; ela deve ser um filtro da API ou do front, não um registro editorial.

### `boxes`

| Campo | Tipo sugerido | Regras |
| --- | --- | --- |
| `id` | uuid | PK |
| `slug` | varchar(120) | único |
| `name` | varchar(80) | obrigatório |
| `owner_name` | varchar(80) | opcional |
| `box_number` | varchar(30) | opcional |
| `category_id` | varchar(40) | FK para `categories` |
| `description` | varchar(400) | obrigatório em revisão |
| `story` | text | opcional |
| `whatsapp` | varchar(30) | privado até validação/publicação |
| `hours` | varchar(240) | opcional |
| `location` | varchar(160) | opcional |
| `status` | enum | estado editorial |
| `version` | integer | controle de concorrência |
| `created_at` | timestamptz | obrigatório |
| `updated_at` | timestamptz | obrigatório |
| `published_at` | timestamptz | opcional |

### `products`

| Campo | Tipo sugerido | Regras |
| --- | --- | --- |
| `id` | uuid | PK |
| `slug` | varchar(120) | único |
| `box_id` | uuid | FK obrigatória para `boxes` |
| `name` | varchar(80) | obrigatório |
| `category_id` | varchar(40) | FK para `categories` |
| `price_cents` | integer | nulo permitido, nunca negativo |
| `description` | varchar(400) | obrigatório em revisão |
| `status` | enum | estado editorial |
| `version` | integer | controle de concorrência |
| `created_at` | timestamptz | obrigatório |
| `updated_at` | timestamptz | obrigatório |
| `published_at` | timestamptz | opcional |

Um produto não pode ser publicado se o box relacionado não estiver publicado.

### `media`

Tabela comum para imagens de boxes, produtos e responsáveis.

| Campo | Tipo sugerido | Regras |
| --- | --- | --- |
| `id` | uuid | PK |
| `storage_key` | text | único |
| `url` | text | URL pública ou assinada |
| `mime_type` | varchar(80) | validado no upload |
| `size_bytes` | integer | limite definido pelo backend |
| `width` | integer | obrigatório para imagens |
| `height` | integer | obrigatório para imagens |
| `alt_text` | varchar(160) | obrigatório para imagem pública |
| `created_by` | uuid | FK para `users` |
| `created_at` | timestamptz | obrigatório |

### `box_media` e `product_media`

Tabelas de relação com `media`, contendo:

```text
entity_id
media_id
position
kind: cover | gallery | owner
```

Deve existir no máximo uma capa por entidade. A ordem da galeria deve ser
determinística por `position`.

### `editorial_events`

Registro imutável das ações editoriais.

| Campo | Tipo sugerido | Regras |
| --- | --- | --- |
| `id` | uuid | PK |
| `entity_type` | varchar(30) | `box` ou `product` |
| `entity_id` | uuid | ID do registro |
| `from_status` | varchar(30) | pode ser nulo na criação |
| `to_status` | varchar(30) | obrigatório |
| `action` | varchar(40) | ação realizada |
| `actor_id` | uuid | usuário responsável |
| `comment` | text | opcional, útil para rejeição |
| `created_at` | timestamptz | obrigatório |

## 3. Estados editoriais

```text
rascunho → em-revisao → pronto → publicado
              ├────────→ rascunho  (rejeição ou devolução)
publicado → arquivado
```

Regras:

- criação inicia em `rascunho`;
- somente `editor`, `reviewer` ou `admin` podem enviar para revisão, conforme a política final;
- `reviewer` aprova e move para `pronto`;
- `publisher` ou `admin` publica um registro `pronto`;
- editar um registro `pronto` ou `publicado` devolve para `rascunho` ou exige nova revisão, sem manter aprovação antiga;
- publicação exige campos obrigatórios, categoria válida, imagens necessárias e
  relacionamento válido;
- toda transição gera `editorial_events` dentro da mesma transação.

## 4. Sessões

### `sessions`

Se PostgreSQL for usado para sessões na primeira versão:

| Campo | Tipo sugerido | Regras |
| --- | --- | --- |
| `id_hash` | varchar(128) | hash do identificador do cookie, PK |
| `user_id` | uuid | FK para `users` |
| `csrf_secret_hash` | varchar(128) | segredo para proteção CSRF |
| `created_at` | timestamptz | obrigatório |
| `last_seen_at` | timestamptz | renovado conforme política |
| `expires_at` | timestamptz | expiração absoluta |
| `revoked_at` | timestamptz | logout ou revogação |
| `ip_hash` | varchar(128) | opcional, sem guardar IP bruto |
| `user_agent_hash` | varchar(128) | opcional |

Alternativa recomendada para escala: Redis para sessões e PostgreSQL para os
dados permanentes. A API deve manter o mesmo contrato independentemente do
armazenamento escolhido.

## 5. Integridade e índices

Índices e restrições iniciais:

- índice único em `users.email` normalizado;
- índice único em `boxes.slug` e `products.slug`;
- índice em `(status, updated_at)` para filas editoriais;
- índice em `products.box_id`;
- índice em `category_id` nos recursos públicos;
- `CHECK price_cents >= 0`;
- `CHECK version >= 1`;
- FKs com comportamento explícito para impedir apagar categoria ou box em uso;
- exclusão lógica ou arquivamento para conteúdo publicado;
- transições editoriais e atualização do registro na mesma transação.

## 6. Migração do catálogo atual

O catálogo demonstrativo atual deve ser convertido por script de seed, não por importação manual no front:

1. criar categorias sem o filtro virtual `todos`;
2. criar boxes preservando slug e dados editoriais;
3. criar produtos com `box_id` e `price_cents`;
4. criar metadados das imagens existentes;
5. definir status inicial conforme `editorialStatus.js`;
6. validar vínculos e slugs duplicados;
7. executar verificação de contagens antes de habilitar a API pública.

O script de seed deve ser idempotente em ambiente de desenvolvimento e nunca
substituir dados de produção sem uma operação explícita.

## 7. Decisões pendentes antes da implementação

- UUID ou outro formato de ID público;
- PostgreSQL também para sessões ou Redis;
- provedor de armazenamento de imagens;
- nomes finais dos papéis e possibilidade de aprovação pelo próprio editor;
- política exata de expiração por inatividade e tempo absoluto;
- campos obrigatórios para publicação de box e produto;
- estratégia de slug quando um nome for alterado;
- política de exclusão, arquivamento e restauração;
- se `whatsapp` será armazenado e publicado na primeira versão.
