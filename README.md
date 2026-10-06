# EscolaSystem Web

Front-end do **EscolaSystem**, sistema de gestão escolar com um portal para cada perfil: administração, direção, professores, orientação, responsáveis e alunos. Cada perfil entra direto na sua tarefa: chamada, lançamento de notas, chamados disciplinares, relatórios e cadastros.

A interface segue o sistema visual "Diário de Classe" (papel, réguas, lousa e tintas de registro), documentado em [`DESIGN.md`](DESIGN.md). O contexto do produto (usuários, regras e princípios) está em [`PRODUCT.md`](PRODUCT.md).

O back-end é a [EscolaSystem API](https://github.com/gentilpedro/EscolaSystemAPI) (.NET).

## Stack

- React 18, TypeScript e Vite
- Tailwind CSS v4, com os tokens do sistema visual em `src/index.css`
- React Router 6
- Atkinson Hyperlegible Next (self-hosted via `@fontsource-variable`)
- Ícones lucide-react

## Como rodar

Pré-requisitos: Node.js 20.19+ ou 22.12+ e a EscolaSystem API rodando localmente.

```bash
cd EscolaSystemWeb
npm ci
cp .env.example .env.local   # opcional: só se a API não estiver em http://localhost:5130
npm run dev                  # http://localhost:3000
```

### Variáveis de ambiente

| Variável | Padrão | Uso |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5130/api` | Endereço base da API, incluindo o `/api` |

Em modo de desenvolvimento, a tela de login mostra os e-mails de teste. Em produção eles não aparecem.

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento na porta 3000 |
| `npm run build` | Checagem de tipos (`tsc -b`) e build de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente |
| `npm run lint` | ESLint |
| `npm run e2e` | Testes de ponta a ponta (Playwright) contra o ambiente Docker |
| `npm run e2e:ui` | Os mesmos testes no modo interativo do Playwright |

### Testes de ponta a ponta

Os testes em `EscolaSystemWeb/e2e/` usam o navegador de verdade contra o ambiente de demonstração (banco, API, seed e build do front). Cobrem a sessão por cookie, a administração de usuários, os relatórios e cadastros da direção e os relatórios e trabalhos do professor.

```bash
# na raiz do repositório: sobe o ambiente com limites de requisição altos (os testes fazem muitos logins)
AUTH_PERMIT_LIMIT=1000 GLOBAL_PERMIT_LIMIT=5000 docker compose up -d

cd EscolaSystemWeb
npx playwright install chromium   # só na primeira vez
npm run e2e                       # ou E2E_CHANNEL=chrome npm run e2e para usar o Chrome instalado
```

Os testes alteram dados da escola de demonstração com nomes únicos, então podem rodar várias vezes no mesmo banco. No GitHub Actions, o workflow **E2E** sobe esse mesmo ambiente com a API do `master` do EscolaSystemAPI e roda a suíte a cada PR. Em caso de falha, o relatório e os traces ficam como artefato.

## Estrutura

```
.
├── EscolaSystemWeb/              # aplicação
│   ├── public/                   # favicon
│   └── src/
│       ├── components/
│       │   ├── ui/               # componentes do sistema visual (botões, campos, tabela, diálogo, avisos)
│       │   ├── layout/           # marca, navegação, guarda de alterações não salvas
│       │   ├── Sidebar.tsx       # estrutura da área logada (lousa lateral)
│       │   └── ProtectedRoute.tsx
│       ├── contexts/             # sessão (AuthContext)
│       ├── features/             # blocos compartilhados entre perfis (chamados, painéis)
│       ├── lib/                  # regras do registro escolar, formatação e paginação
│       ├── pages/                # uma pasta por perfil: admin, director, teacher, orientador, parent, student
│       ├── services/api.ts       # cliente HTTP e endpoints da API
│       ├── types/                # contratos da API
│       └── index.css             # tokens e estilos base
├── .github/workflows/ci-cd.yml   # pipeline de CI/CD
├── .claude/skills/fluxo-issue-mr # skill do fluxo issue → branch → PR
├── DESIGN.md                     # sistema visual
├── PRODUCT.md                    # contexto do produto
└── CORRECOES-FRONT.md            # correções pendentes, cada uma vira uma issue
```

### Rotas por perfil

| Perfil | Rotas |
|---|---|
| Administração | `/admin`, `/admin/schools`, `/admin/users`, `/admin/settings` |
| Direção | `/director`, `/director/staff`, `/director/classes`, `/director/students`, `/director/reports`, `/director/disciplinary` |
| Professor | `/teacher`, `/teacher/classes`, `/teacher/attendance`, `/teacher/grades`, `/teacher/assignments`, `/teacher/reports`, `/teacher/disciplinary` |
| Orientação | `/orientador`, `/orientador/students`, `/orientador/attendance`, `/orientador/grades`, `/orientador/disciplinary` |
| Responsável | `/parent`, `/parent/disciplinary` |
| Aluno | `/student`, `/student/grades`, `/student/attendance`, `/student/assignments` |

As páginas públicas são `/` (apresentação) e `/login`.

### Sessão e segurança

O front não guarda token. A API grava a sessão em cookies `HttpOnly` que o JavaScript não lê, e o `services/api.ts`:

- manda toda requisição com `credentials: 'include'`;
- em POST, PUT, PATCH e DELETE, repete o valor do cookie `es_csrf` no cabeçalho `X-CSRF-Token` (proteção CSRF);
- quando recebe 401, chama `POST /api/auth/refresh` uma vez (requisições simultâneas esperam a mesma renovação) e repete a requisição. Se a renovação falhar, a sessão acabou e o usuário volta ao login.

Ao abrir a página, o `AuthContext` pergunta a `/api/auth/me` quem está logado. Sem o cookie `es_csrf`, que existe só enquanto há sessão, nem pergunta.

Front e API precisam estar no mesmo site para os cookies `SameSite=Strict` irem junto: `localhost` em qualquer porta no desenvolvimento, ou subdomínios do mesmo domínio em produção (ex.: `app.escola.com.br` e `api.escola.com.br`, com `Auth:CookieDomain=escola.com.br` na API). A origem do front precisa estar em `Cors:AllowedOrigins` da API.

**Content-Security-Policy.** O `npm run preview` (e o Docker) manda o cabeçalho definido em `vite.config.ts`: scripts, estilos e fontes só da própria origem e chamadas só para a API de `VITE_API_URL`. Em produção, o servidor que entrega o `dist/` deve mandar o mesmo cabeçalho, por exemplo no nginx:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.escola.com.br; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
add_header X-Content-Type-Options nosniff always;
add_header Referrer-Policy strict-origin-when-cross-origin always;
```

## Fluxo de trabalho

Todo trabalho nasce de uma **issue** e entra na `master` por um **Pull Request** ligado a ela (`Closes #N`). O passo a passo está na skill [`fluxo-issue-mr`](.claude/skills/fluxo-issue-mr/SKILL.md):

- Branches: `feature/<n>-<slug>`, `fix/<n>-<slug>` ou `hotfix/<n>-<slug>`
- Commits em Conventional Commits, em português (`feat:`, `fix:`, `docs:`, `ci:`…)
- Nada vai direto para a `master`

## CI/CD

O workflow [`ci-cd.yml`](.github/workflows/ci-cd.yml) roda `npm ci`, lint, testes (quando houver) e build em todo PR e push na `master`. Uma tag `vX.Y.Z` gera uma GitHub Release com o build.

O lint ainda tem pendências herdadas e, por enquanto, não bloqueia o merge.
