# Guia do backend

Status: guia de operação planejado. Os comandos abaixo serão disponibilizados somente
quando a implementação for autorizada.

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

## Estrutura prevista

~~~
api/
├── src/
│   ├── auth/ users/ categories/ media/ boxes/ products/
│   ├── notifications/ audit/ health/
│   └── common/ config/ database/
├── prisma/
└── storage/uploads/       # ignorado pelo Git; persistido em volume Docker
~~~

O backend usa TypeScript estrito, npm, Node 24, NestJS, Prisma e PostgreSQL.
ESLint, Prettier e Jest se aplicam apenas a api/; os frontends não serão
reformatados por consequência.

## Ambiente e segredos

- Arquivos .env reais são ignorados pelo Git.
- .env.example contém apenas valores fictícios e nomes de variáveis.
- VITE_* expõe somente informações públicas, como URL da API.
- Segredos, cookies, hashes, tokens, senhas e credenciais não entram em código,
  documentação versionada ou logs.

## Banco, migrations e seed

Prisma controla o schema e migrations versionadas. Antes de qualquer migration,
importação ou teste que altere dados, será criado backup por pg_dump. Migrations
destrutivas, resets, restaurações e exclusões dependem de autorização explícita.

O seed inicial parte de src/data/catalog.js, é idempotente e não sobrescreve dados de
gestão. PostgreSQL só se torna fonte oficial depois da conferência do seed e da
integração dos frontends.

## Mídias, logs e saúde

Arquivos processados ficam em api/storage/uploads/, em volume Docker, enquanto o
PostgreSQL guarda metadados e relações. O endpoint /api/v1/health informa a saúde da
API e do banco sem revelar detalhes internos.

Logs incluem método, rota, status, duração e requestId. Eles não registram segredos
ou dados de autenticação. O cache público em memória é curto e opcional; em
desenvolvimento pode ficar desabilitado.

## Testes e documentação técnica

Os scripts futuros incluem lint, test, test:e2e e build. O banco de testes é isolado
e não deve limpar o banco de desenvolvimento. A cobertura inicial inclui sessões,
permissões, fluxo editorial, privacidade, conflitos, convites, mídias e saúde.

Swagger/OpenAPI ficará disponível apenas em desenvolvimento, em /api/docs.
docs/CONTRATO-API.md é a referência humana do contrato, e docs/MODELO-DADOS.md
documenta o modelo e as regras de persistência.

