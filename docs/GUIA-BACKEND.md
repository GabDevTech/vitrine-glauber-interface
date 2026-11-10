# Guia do backend

Status: PostgreSQL local validado e primeira migration aplicada em desenvolvimento após backup. O seed demonstrativo foi preparado e conferido sem acessar o banco, mas ainda não foi executado; as rotas planejadas sob `/api/v1` ainda não foram implementadas.

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

## Estrutura prevista

~~~
api/
├── src/
│   ├── auth/ users/ categories/ media/ boxes/ products/
│   ├── notifications/ audit/ health/
│   └── common/ config/ database/
├── prisma/
└── storage/uploads/       # pasta local futura, ignorada pelo Git
~~~

O backend inicial usa TypeScript estrito, npm, Node 24 e NestJS. Prisma já está instalado para modelagem; a integração com as regras da API virá na etapa do banco. ESLint, Prettier e Jest se aplicam apenas a `api/`; os frontends não serão reformatados por consequência.

## Prisma e primeira migration

O Prisma CLI, Client e adaptador PostgreSQL estão alinhados na versão `7.10.1`. A configuração fica em `api/prisma.config.ts`, que lê todos os arquivos `.prisma` da pasta `api/prisma/`. O arquivo `api/prisma/schema.prisma` define o gerador e o PostgreSQL; `api/prisma/models/` organiza enums e modelos por domínio. Esses modelos descrevem tabelas e relações, não criam os boxes e produtos demonstrativos: os registros serão tratados no seed. As migrations versionadas ficam em `api/prisma/migrations/`. O exemplo de conexão está em `api/.env.example`. A URL real deve ficar em `api/.env`, ignorado pelo Git, usando a mesma senha do `POSTGRES_PASSWORD` no `.env` da raiz. O Client gerado fica em `api/src/generated/prisma/`, também ignorado pelo Git.

Na pasta `api/`, `npm exec prisma -- validate` confere o schema e `npm exec prisma -- generate` gera somente o Client. Esses comandos requerem `DATABASE_URL` no ambiente, mas não criam tabelas. A migration `20261109_initial_schema` foi aplicada ao PostgreSQL local após um backup `pg_dump` em `backups/`, ignorado pelo Git. A verificação encontrou 18 tabelas do projeto, 13 restrições `CHECK`, dois gatilhos da auditoria e nenhum registro de box ou produto. O seed continua pendente e exige autorização separada; as restrições SQL e as regras que serão implementadas na API estão registradas em `docs/MODELO-DADOS.md`.

## Ambiente e segredos

- Arquivos .env reais são ignorados pelo Git.
- .env.example contém apenas valores fictícios e nomes de variáveis.
- VITE_* expõe somente informações públicas, como URL da API.
- Segredos, cookies, hashes, tokens, senhas e credenciais não entram em código, documentação versionada ou logs.

## Banco, migrations e seed

Prisma controla o schema e migrations versionadas. Antes de qualquer migration, importação ou teste que altere dados, será criado backup por pg_dump. Migrations destrutivas, resets, restaurações e exclusões dependem de autorização explícita.

O seed demonstrativo em `api/prisma/seed.mjs` lê `src/data/catalog.js` e `gestao/src/data/editorialStatus.js`. O comando `npm run seed:demo:check`, executado em `api/`, confere a fonte, as relações e os arquivos de imagem sem acessar o banco. A execução posterior exige `DATABASE_URL`, `SEED_DEMO_CONFIRM=vitrine-glauber`, um Client Prisma gerado e compilado e o comando explícito `prisma db seed`; ela ainda depende de aprovação. O seed preserva categorias e itens já encontrados por seus códigos ou slugs publicados, não sobrescreve alterações de gestão, não cria contas fictícias e não roda automaticamente com migrations. Para novos itens, cria arquivos WebP em `api/storage/uploads/` com chaves aleatórias e registros de mídia correspondentes. Antes da execução, será feito novo backup; depois, serão conferidos contagens, revisões e relações. PostgreSQL só se torna fonte oficial depois dessa conferência e da integração dos frontends.

## Mídias, logs e saúde

Os arquivos processados ficarão em `api/storage/uploads/`, pasta local no Windows e ignorada pelo Git. Ela ainda não existe: o seed autorizado ou o futuro módulo de mídia a criará quando precisar gravar arquivos. O volume `postgres_data` do Compose contém apenas o banco. Se a API vier a rodar em contêiner, a persistência dos uploads exigirá configuração própria. O PostgreSQL guardará somente metadados e relações. O endpoint `/api/v1/health` informará a saúde da API e do banco sem revelar detalhes internos.

Logs incluem método, rota, status, duração e requestId. Eles não registram segredos ou dados de autenticação. O cache público em memória é curto e opcional; em
desenvolvimento pode ficar desabilitado.

## Testes e documentação técnica

Na pasta `api/`, já estão disponíveis `npm run lint`, `npm test`, `npm run test:e2e` e `npm run build`. Os testes Jest executam em uma única sequência para reduzir o consumo de recursos. O banco de testes futuro será isolado e não deve limpar o banco de desenvolvimento. A cobertura planejada inclui sessões, permissões, fluxo editorial, privacidade, conflitos, convites, mídias e saúde.

Swagger/OpenAPI ficará disponível apenas em desenvolvimento, em /api/docs.
docs/CONTRATO-API.md é a referência humana do contrato, e docs/MODELO-DADOS.md
documenta o modelo e as regras de persistência.

