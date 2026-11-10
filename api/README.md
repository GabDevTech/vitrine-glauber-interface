# API da Vitrine Glauber

A API NestJS consulta o PostgreSQL e fornece os dados públicos de categorias, boxes, produtos e mídias à vitrine. A área de gestão ainda não usa a API; autenticação e operações administrativas permanecem em desenvolvimento.

## Requisitos

Use Node.js 24 com npm, Docker Desktop com Docker Compose v2 e Git. Na máquina local, as portas 5432 (PostgreSQL), 3000 (API) e 4180 (vitrine) precisam estar livres. O PostgreSQL roda em contêiner; API e frontend rodam no computador durante o desenvolvimento.

## Primeira execução

Siga [Executar o projeto em uma máquina nova](../docs/GUIA-BACKEND.md#executar-o-projeto-em-uma-maquina-nova). Esse guia descreve a criação dos arquivos `.env`, instalação dos dois conjuntos de dependências, geração do Prisma Client, aplicação das migrations, seed e inicialização dos três serviços.

## Comandos nesta pasta

| Comando | Função |
| --- | --- |
| `npm ci` | Instala as dependências conforme `api/package-lock.json` |
| `npm exec prisma -- generate` | Gera o Prisma Client local, ignorado pelo Git |
| `npm exec prisma -- migrate deploy` | Aplica migrations versionadas pendentes sem resetar o banco |
| `npm exec prisma -- db seed` | Carrega o catálogo demonstrativo após definir `SEED_DEMO_CONFIRM=vitrine-glauber` |
| `npm run seed:demo:check` | Confere arquivos de origem e relações sem conectar ao banco |
| `npm run start` | Inicia a API na porta 3000 |
| `npm run start:dev` | Inicia a API em modo de desenvolvimento com reinício automático |
| `npm test` | Executa os testes Jest em sequência |

Em PowerShell, defina a confirmação do seed com `$env:SEED_DEMO_CONFIRM = 'vitrine-glauber'`; em CMD, use `set SEED_DEMO_CONFIRM=vitrine-glauber`. A confirmação é exigida para evitar execução acidental. Rode o seed apenas no banco local de desenvolvimento.

## Rotas públicas disponíveis

- `GET /api/v1/health` verifica a API e a conexão com PostgreSQL.
- `GET /api/v1/categories` lista categorias ativas.
- `GET /api/v1/boxes` lista boxes publicados; `GET /api/v1/boxes/:slug` consulta um box pelo slug.
- `GET /api/v1/products` lista produtos publicados; `GET /api/v1/products/:slug` consulta um produto pelo slug.
- `GET /api/v1/media/:id` entrega uma imagem vinculada a conteúdo publicado.

Parâmetros, formatos de resposta e regras de visibilidade estão no [Contrato da API](../docs/CONTRATO-API.md). O [Guia do backend](../docs/GUIA-BACKEND.md) cobre Docker, ambiente e operação local; o [Modelo de dados](../docs/MODELO-DADOS.md) documenta as tabelas e relações.
