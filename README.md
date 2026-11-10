# Vitrine Glauber

Site público para descobrir boxes e produtos do Centro Cultural Glauber Rocha, salvar favoritos e planejar uma visita. Vue 3, JavaScript, Quasar 2, Vite 7, Pinia e Vue Router.

## Começar

Instale Node.js 22.12 ou superior e npm. Na pasta do projeto:

```sh
npm ci
npm run dev
```

Abra http://localhost:4180. Se a porta estiver ocupada, use o endereço informado pelo Vite. Para parar, pressione `Ctrl+C`.

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
- [Produto](PRODUCT.md): objetivo, jornada e limites da demonstração.
- [Sistema visual](DESIGN.md): cores, tipografia, componentes e responsividade.
- [Marca](brand-spec.md), [direção aprovada](direction-approved.md) e [origem dos arquivos](docs/ASSETS.md).

Comece por `src/main.js`, `src/router/index.js` e `src/pages/HomePage.vue`. Os registros editáveis ficam em `src/data/catalog.js`.

Catálogo, expositores, preços e contatos são demonstrativos. Fotos são ilustrativas. Contatos fictícios estão bloqueados; não há pagamento, login ou painel administrativo. Favoritos e preferências ficam apenas no navegador. O mapa externo só carrega quando solicitado.

Para hospedar, sirva `dist/` com fallback para `index.html`: o Vue Router precisa dele ao abrir diretamente uma rota como `/boxes/barro-da-serra`.
