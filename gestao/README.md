# Gestão da Vitrine Glauber

Aplicação de gestão separada da vitrine pública. O acesso, a gestão editorial de boxes, produtos, revisões, categorias e o upload de mídias agora utilizam diretamente a API (`/api/v1/management/*`) e o PostgreSQL, refletindo publicações e inativações automaticamente na vitrine pública.

Na raiz do repositório, instale as dependências uma vez e inicie a gestão:

```sh
npm ci
npm run dev:gestao
```

Para usar o login, mantenha PostgreSQL e API ativos e crie a conta inicial pelo comando `npm run admin:bootstrap` dentro de `api/`. Abra o link apresentado pelo comando, aceite o convite na página separada e defina nome de usuário e senha. Depois, entre em <http://localhost:4175/gestao/login> com o e-mail ou nome de usuário e a senha escolhida. O convite expira em 24 horas e não é enviado automaticamente por e-mail; consulte o procedimento em `docs/GUIA-BACKEND.md`.

Os cadastros e mídias são persistidos no PostgreSQL e em `api/storage/uploads/` através da API. Sair revoga a sessão de autenticação e limpa o estado carregado na aplicação. “Publicar” atualiza a vitrine pública e “Inativar” retira o item do ar sem apagar seu histórico.

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
