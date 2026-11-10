# Gestão da Vitrine Glauber

Aplicação demonstrativa de gestão, separada da vitrine pública. Permite conhecer o fluxo de boxes, produtos e revisão editorial sem alterar os dados publicados.

Na raiz do repositório, instale as dependências uma vez e inicie a gestão:

```sh
npm ci
npm run dev:gestao
```

Abra <http://localhost:4175/gestao/login> e preencha qualquer login e senha. Não há conta ou autenticação real. O marcador em `sessionStorage` serve apenas para organizar a navegação.

Os cadastros são cópias do catálogo inicial e ficam somente na memória da aplicação. Recarregar a página ou sair descarta as alterações. “Salvar” e “Publicar” não enviam dados a servidor nem modificam a vitrine pública.

## Comandos

Execute na raiz, sem instalar um segundo conjunto de dependências em `gestao/`.

| Comando                    | Finalidade                                  |
| -------------------------- | ------------------------------------------- |
| `npm run dev:gestao`       | Desenvolvimento na porta 4175               |
| `npm run build:gestao`     | Compilação em `gestao/dist/`                |
| `npm run test:gestao:unit` | Verificações das regras e dados da gestão   |
| `npm run test:gestao:e2e`  | Verificações da interface com Playwright    |
| `npm run format`           | Formatação do repositório, incluindo gestão |
| `npm run format:check`     | Conferência de formatação                   |

Os testes de navegador precisam dos navegadores do Playwright instalados no ambiente. O resultado de cada execução deve ser consultado no terminal; este guia não registra uma contagem fixa de testes.

## Por onde começar

- [Guia para iniciantes](docs/GUIA-GESTAO.md): pastas, fluxo de dados e exemplo de alteração.
- [Produto e limites](PRODUCT.md): o que a demonstração representa.
- [Sistema visual](DESIGN.md): cores, tipografia e componentes extraídos do código.

O ponto de entrada é `gestao/src/main.js`; as rotas ficam em `gestao/src/router/index.js`. A configuração `gestao/vite.config.js` usa a base `/gestao/`, os arquivos públicos da raiz e dependências compartilhadas. A vitrine pública mantém sua própria entrada, suas páginas e suas stores.
