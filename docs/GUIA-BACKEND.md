# Guia do backend

Status: PostgreSQL local validado e estrutura inicial do NestJS criada. Prisma, schema, migrations e rotas da API ainda não foram implementados.

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

O backend inicial usa TypeScript estrito, npm, Node 24 e NestJS. Prisma será integrado na etapa do banco. ESLint, Prettier e Jest se aplicam apenas a `api/`; os frontends não serão reformatados por consequência.

## Ambiente e segredos

- Arquivos .env reais são ignorados pelo Git.
- .env.example contém apenas valores fictícios e nomes de variáveis.
- VITE_* expõe somente informações públicas, como URL da API.
- Segredos, cookies, hashes, tokens, senhas e credenciais não entram em código,
  documentação versionada ou logs.

## Banco, migrations e seed

Prisma controla o schema e migrations versionadas. Antes de qualquer migration, importação ou teste que altere dados, será criado backup por pg_dump. Migrations destrutivas, resets, restaurações e exclusões dependem de autorização explícita.

O seed inicial parte de src/data/catalog.js, é idempotente e não sobrescreve dados de gestão. PostgreSQL só se torna fonte oficial depois da conferência do seed e da integração dos frontends.

## Mídias, logs e saúde

Quando o módulo de mídia for implementado, os arquivos processados ficarão em `api/storage/uploads/`, pasta local no Windows e ignorada pelo Git. A pasta ainda não existe; será criada junto ao módulo. O volume `postgres_data` do Compose contém apenas o banco. Se a API vier a rodar em contêiner, a persistência dos uploads exigirá configuração própria. O PostgreSQL guardará somente metadados e relações. O endpoint `/api/v1/health` informará a saúde da API e do banco sem revelar detalhes internos.

Logs incluem método, rota, status, duração e requestId. Eles não registram segredos ou dados de autenticação. O cache público em memória é curto e opcional; em
desenvolvimento pode ficar desabilitado.

## Testes e documentação técnica

Na pasta `api/`, já estão disponíveis `npm run lint`, `npm test`, `npm run test:e2e` e `npm run build`. Os testes Jest executam em uma única sequência para reduzir o consumo de recursos. O banco de testes futuro será isolado e não deve limpar o banco de desenvolvimento. A cobertura planejada inclui sessões, permissões, fluxo editorial, privacidade, conflitos, convites, mídias e saúde.

Swagger/OpenAPI ficará disponível apenas em desenvolvimento, em /api/docs.
docs/CONTRATO-API.md é a referência humana do contrato, e docs/MODELO-DADOS.md
documenta o modelo e as regras de persistência.

