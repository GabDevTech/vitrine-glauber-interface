# Vitrine Glauber

Site público para descobrir boxes e produtos do Centro Cultural Glauber Rocha, salvar favoritos e planejar uma visita. A vitrine usa Vue 3, JavaScript, Quasar 2, Vite 7, Pinia e Vue Router. A área de gestão fica em `gestao/`; a estrutura NestJS/PostgreSQL, a primeira migration e o seed demonstrativo já foram aplicados ao banco local. A vitrine pública consulta a API para categorias, boxes, produtos e imagens. A gestão ainda usa dados locais; autenticação e operações administrativas na API continuam em desenvolvimento.

## Começar

Para executar a vitrine ligada ao banco em um clone novo, instale Node.js 24, npm e Docker Desktop com Docker Compose. Siga o [passo a passo de instalação local](docs/GUIA-BACKEND.md#executar-o-projeto-em-uma-maquina-nova), que configura os ambientes, instala as dependências, cria o banco, aplica a migration e carrega o seed demonstrativo.

Depois da preparação inicial, inicie o banco com `docker compose up -d postgres`; em um terminal dentro de `api/`, execute `npm run start`; e, na raiz do projeto, execute `npm run dev`. Abra http://localhost:4180. O Vite encaminha `/api/v1` para a API na porta 3000. Para encerrar, pressione `Ctrl+C` nos terminais da API e da vitrine. O banco pode ser parado com `docker compose stop postgres`.

## Comandos

| Comando                           | Para que serve                                 |
| --------------------------------- | ---------------------------------------------- |
| `npm run dev`                     | Desenvolvimento com atualização automática     |
| `npm test`                        | Testes unitários de catálogo e armazenamento   |
| `npx playwright install chromium` | Instala o navegador dos testes de interface    |
| `npm run test:e2e`                | Testes de navegação e interface com Playwright |
| `npm run format`                  | Formata os arquivos configurados com Prettier  |
| `npm run format:check`            | Confere a formatação sem alterar arquivos      |
| `npm run build`                   | Gera a versão de produção em `dist/`           |
| `npm run preview`                 | Confere o build localmente; não publica o site |

## Entender e alterar

A aplicação de gestão fica separada em `gestao/`. Execute `npm run dev:gestao` e abra
http://localhost:4175/gestao/login. A estrutura e os comandos estão em
[Gestão](gestao/README.md), com um [guia para iniciantes](gestao/docs/GUIA-GESTAO.md).

- [Guia de Vue para iniciantes](docs/GUIA-VUE.md): estrutura, conceitos e exemplos de alteração.
- [Contrato da API](docs/CONTRATO-API.md): rotas, autenticação, permissões e respostas previstas.
- [Modelo de dados](docs/MODELO-DADOS.md): entidades, revisões, relações e regras de persistência previstas.
- [Guia do backend](docs/GUIA-BACKEND.md): arquitetura local, Docker, ambiente, banco, seed e testes planejados.
- [Produto](PRODUCT.md): objetivo, jornada e limites da demonstração.
- [Sistema visual](DESIGN.md): cores, tipografia, componentes e responsividade.
- [Marca](brand-spec.md), [direção aprovada](direction-approved.md) e [origem dos arquivos](docs/ASSETS.md).

Comece por `src/main.js`, `src/router/index.js` e `src/pages/HomePage.vue`. A vitrine lê os registros publicados por `src/services/catalogService.js`; `src/data/catalog.js` permanece como referência do seed e para migração dos favoritos antigos, não como fonte da vitrine em execução.

Catálogo, expositores, preços e contatos são demonstrativos. Fotos são ilustrativas. Contatos fictícios estão bloqueados; não há pagamento, login real ou publicação administrativa. A gestão demonstrativa fica em `gestao/`, sem backend. Favoritos, preferências e alterações da gestão ficam apenas no navegador. O mapa externo só carrega quando solicitado.

Para hospedar, sirva `dist/` com fallback para `index.html`: o Vue Router precisa dele ao abrir diretamente uma rota como `/boxes/barro-da-serra`. Configure também o servidor de produção para encaminhar `/api/v1` à API na mesma origem; o proxy de `vite.config.js` vale apenas para desenvolvimento.
