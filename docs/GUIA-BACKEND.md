# Guia do backend

Status: PostgreSQL local validado, primeira migration aplicada e seed demonstrativo executado após backup. O banco contém 4 categorias, 5 boxes, 8 produtos, 13 mídias e 4 revisões de trabalho. O NestJS expõe saúde e consulta pública ao catálogo e às mídias, usadas pela vitrine pública. A gestão ainda não consulta a API; autenticação e operações administrativas não foram implementadas.

## Arquitetura local

O projeto terá três aplicações e um banco local:

| Serviço | Tecnologia | Porta |
| --- | --- | --- |
| Vitrine pública | Vue/Quasar | 4180 |
| Gestão | Vue/Vite | 4175 |
| API | NestJS | 3000 |
| PostgreSQL | Docker | 5432:5432 |

O PostgreSQL rodará em Docker com a mesma porta no computador e no contêiner. Se a
porta 5432 estiver ocupada, a situação será apresentada para decisão; não haverá
remapeamento automático.

## PostgreSQL local

O Docker Desktop e o PostgreSQL 17 foram instalados e validados localmente. A
configuração está em `docker-compose.yml`; as credenciais locais ficam em `.env`,
que é ignorado pelo Git. O modelo público dessas variáveis está em `.env.example`.

Com o Docker Desktop em execução, use:

```sh
docker compose up -d postgres
docker compose ps
docker compose down
```

O primeiro comando inicia apenas o banco; o segundo confirma seu estado; o terceiro
para e remove somente o contêiner e a rede, preservando o volume `postgres_data` e
seus dados. Não usar `docker compose down -v` sem autorização explícita, pois essa
variação remove o volume persistente.

## Executar o projeto em uma máquina nova

Este procedimento prepara um clone recém-baixado, sem depender do banco que existe no computador de outra pessoa. Requisitos: Git, Node.js 24 com npm, Docker Desktop com Docker Compose v2 e as portas locais 5432 (PostgreSQL), 3000 (API) e 4180 (vitrine) disponíveis. No CMD, use `copy` nos comandos de cópia; no PowerShell, use `Copy-Item`. Se a política do PowerShell bloquear `npm.ps1`, use `npm.cmd` nos comandos npm.

Na raiz do repositório, crie os arquivos de ambiente locais a partir dos exemplos. No PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item api/.env.example api/.env
```

No CMD, use `copy .env.example .env` e `copy api\.env.example api\.env`.

Os exemplos usam credenciais fictícias para desenvolvimento. Se você as alterar em `.env`, atualize também a senha correspondente em `api/.env`; os valores de banco, usuário, senha, host, porta e nome do banco precisam corresponder. Os arquivos `.env` reais são ignorados pelo Git e não devem ser enviados no pull request.

Instale cada conjunto de dependências usando seu lockfile. Execute os comandos na raiz e depois em `api/`:

```powershell
npm ci
cd api
npm ci
```

Inicie o PostgreSQL. Execute na raiz do repositório e aguarde o estado `healthy` em `docker compose ps`:

```powershell
cd ..
docker compose up -d postgres
docker compose ps
```

Prepare a API em um clone novo. Dentro de `api/`, gere o Prisma Client (ele não é versionado), aplique as migrations versionadas e carregue o seed demonstrativo:

```powershell
cd api
npm exec prisma -- generate
npm exec prisma -- migrate deploy
$env:SEED_DEMO_CONFIRM = 'vitrine-glauber'
npm exec prisma -- db seed
Remove-Item Env:SEED_DEMO_CONFIRM
```

O seed cria os registros demonstrativos e converte as imagens de origem em arquivos WebP dentro de `api/storage/uploads/`. Essa pasta é ignorada pelo Git e deve ser criada na máquina de cada pessoa. O seed é idempotente e preserva registros existentes; execute-o somente no banco de desenvolvimento configurado no arquivo `api/.env`. A migration cria a estrutura vazia e não carrega registros por conta própria.

Para iniciar a aplicação, mantenha o PostgreSQL ativo. Em um terminal na pasta `api/`, rode `npm run start`; em outro, na raiz, rode `npm run dev`. Abra `http://localhost:4180`. O Vite encaminha as chamadas `/api/v1` para `http://127.0.0.1:3000`. A resposta em `http://localhost:3000/api/v1/health` deve indicar `ok`, e as listas públicas devem exibir 5 boxes e 8 produtos. Para interromper, pressione `Ctrl+C` nos terminais da API e do Vite; para parar o banco sem apagar seus dados, use `docker compose stop postgres` na raiz.

Nas próximas execuções, não repita a instalação, geração do Client, migration ou seed, a menos que dependências ou migrations tenham mudado. Basta iniciar Docker, API e vitrine nos respectivos terminais.

No CMD, defina a confirmação e rode o seed na mesma janela:

```cmd
set SEED_DEMO_CONFIRM=vitrine-glauber
npm exec prisma -- db seed
set SEED_DEMO_CONFIRM=
```

Não use o seed em produção.

## Estrutura prevista

~~~
api/
├── src/
│   ├── auth/ users/ categories/ media/ boxes/ products/
│   ├── notifications/ audit/ health/
│   └── common/ config/ database/
├── prisma/
└── storage/uploads/       # mídias do seed, ignoradas pelo Git
~~~

O backend usa TypeScript estrito, npm, Node 24 e NestJS. O Prisma já consulta o PostgreSQL nas rotas de saúde e catálogo; autenticação e regras de gestão continuam pendentes. ESLint, Prettier e Jest se aplicam apenas a `api/`; os frontends não são reformatados por consequência.

## Consulta pública da API

Com o PostgreSQL em execução, o arquivo local `api/.env` fornece `DATABASE_URL`. Na pasta `api/`, `npm run start` inicia o servidor na porta 3000. As rotas de consulta são `GET /api/v1/categories`, `/api/v1/boxes`, `/api/v1/boxes/:slug`, `/api/v1/products`, `/api/v1/products/:slug` e `/api/v1/media/:id`; `/api/v1/health` verifica a API e o banco. Os parâmetros e formatos de resposta estão em `docs/CONTRATO-API.md`. As listas retornam somente revisões publicadas; uma revisão de trabalho não substitui o conteúdo público. Produtos de box arquivado e mídias sem vínculo público não são entregues. Na execução local, o Vite da vitrine encaminha `/api/v1` para `127.0.0.1:3000`, sem cookies nas consultas públicas. Em produção, o servidor que entrega a vitrine precisará encaminhar o mesmo caminho à API. A gestão permanece independente da API nesta etapa.

## Prisma e primeira migration

O Prisma CLI, Client e adaptador PostgreSQL estão alinhados na versão `7.10.1`. A configuração fica em `api/prisma.config.ts`, que lê todos os arquivos `.prisma` da pasta `api/prisma/`. O arquivo `api/prisma/schema.prisma` define o gerador e o PostgreSQL; `api/prisma/models/` organiza enums e modelos por domínio. Esses modelos descrevem tabelas e relações; os registros demonstrativos são carregados pelo seed. As migrations versionadas ficam em `api/prisma/migrations/`. O exemplo de conexão está em `api/.env.example`. A URL real deve ficar em `api/.env`, ignorado pelo Git, usando a mesma senha do `POSTGRES_PASSWORD` no `.env` da raiz. O Client gerado fica em `api/src/generated/prisma/`, também ignorado pelo Git.

Na pasta `api/`, `npm exec prisma -- validate` confere o schema e `npm exec prisma -- generate` gera somente o Client. Esses comandos requerem `DATABASE_URL` no ambiente, mas não criam tabelas. A migration `20261109_initial_schema` foi aplicada ao PostgreSQL local após um backup `pg_dump` em `backups/`, ignorado pelo Git. A verificação encontrou 18 tabelas do projeto, 13 restrições `CHECK` e dois gatilhos da auditoria. O seed demonstrativo foi executado posteriormente, também após backup; as restrições SQL e as regras que serão implementadas na API estão registradas em `docs/MODELO-DADOS.md`.

## Ambiente e segredos

- Arquivos .env reais são ignorados pelo Git.
- .env.example contém apenas valores fictícios e nomes de variáveis.
- O frontend usa o caminho relativo `/api/v1`; não é necessária uma variável `VITE_*` para o endereço da API local.
- Segredos, cookies, hashes, tokens, senhas e credenciais não entram em código, documentação versionada ou logs.

## Banco, migrations e seed

Prisma controla o schema e migrations versionadas. Antes de qualquer migration, importação ou teste que altere dados, será criado backup por pg_dump. Migrations destrutivas, resets, restaurações e exclusões dependem de autorização explícita.

O seed demonstrativo em `api/prisma/seed.mjs` lê `src/data/catalog.js` e `gestao/src/data/editorialStatus.js`. O comando `npm run seed:demo:check`, executado em `api/`, confere a fonte, as relações e os arquivos de imagem sem acessar o banco. A execução autorizada usou `DATABASE_URL`, `SEED_DEMO_CONFIRM=vitrine-glauber` e o Client Prisma compilado. O seed preserva categorias e itens já encontrados por seus códigos ou slugs publicados, não sobrescreve alterações de gestão, não cria contas fictícias e não roda automaticamente com migrations. Para novos itens, cria arquivos WebP em `api/storage/uploads/` com chaves aleatórias e registros de mídia correspondentes. Antes da execução, foi criado e validado `backups/pre-demo-seed-20261110T002750Z.dump`, ignorado pelo Git. A conferência posterior encontrou 4 categorias, 3 papéis, 5 boxes, 8 produtos, 13 mídias WebP, 4 revisões de trabalho e nenhuma conta. Cada box publicado tem capa, cada produto publicado tem uma imagem de capa e nenhum produto ficou sem box. PostgreSQL é a fonte do catálogo publicado da vitrine; a gestão ainda usa IndexedDB.

## Mídias, logs e saúde

Os 13 arquivos WebP criados pelo seed estão em `api/storage/uploads/`, pasta local no Windows e ignorada pelo Git. O volume `postgres_data` do Compose contém apenas o banco. Se a API vier a rodar em contêiner, a persistência dos uploads exigirá configuração própria. O PostgreSQL guarda somente metadados e relações. O endpoint `/api/v1/health` consulta o banco e responde `200` quando ambos estão disponíveis ou `503` com erro genérico quando a consulta falha, sem revelar detalhes internos.

Logs incluem método, rota, status, duração e requestId. Eles não registram segredos ou dados de autenticação. O cache público em memória é curto e opcional; em
desenvolvimento pode ficar desabilitado.

## Testes e documentação técnica

Na pasta `api/`, já estão disponíveis `npm run lint`, `npm test`, `npm run test:e2e` e `npm run build`. Os testes Jest executam em uma única sequência para reduzir o consumo de recursos. O banco de testes futuro será isolado e não deve limpar o banco de desenvolvimento. A cobertura planejada inclui sessões, permissões, fluxo editorial, privacidade, conflitos, convites, mídias e saúde.

Swagger/OpenAPI ficará disponível apenas em desenvolvimento, em /api/docs.
docs/CONTRATO-API.md é a referência humana do contrato, e docs/MODELO-DADOS.md
documenta o modelo e as regras de persistência.

