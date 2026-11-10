# Gestão da Vitrine Glauber

Aplicação de gestão separada da vitrine pública. O acesso agora usa a API, com convite inicial e sessão por cookie. Boxes, produtos e mídias do painel ainda usam armazenamento local do navegador e não alteram os dados publicados.

Na raiz do repositório, instale as dependências uma vez e inicie a gestão:

```sh
npm ci
npm run dev:gestao
```

Para usar o login, mantenha PostgreSQL e API ativos e crie a conta inicial pelo comando `npm run admin:bootstrap` dentro de `api/`. Abra o link apresentado pelo comando, aceite o convite na página separada e defina nome de usuário e senha. Depois, entre em <http://localhost:4175/gestao/login> com o e-mail ou nome de usuário e a senha escolhida. O convite expira em 24 horas e não é enviado automaticamente por e-mail; consulte o procedimento em `docs/GUIA-BACKEND.md`.

Os cadastros são cópias do catálogo inicial e ficam salvos no IndexedDB deste navegador. Recarregar a página preserva as alterações; sair revoga a sessão de autenticação e limpa o estado carregado na aplicação. “Salvar” e “Publicar” ainda não enviam dados editoriais ao servidor nem modificam a vitrine pública. Para limpar os dados locais, use as ferramentas de armazenamento do navegador.

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
