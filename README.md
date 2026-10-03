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
| Professor | `/teacher`, `/teacher/classes`, `/teacher/attendance`, `/teacher/grades`, `/teacher/disciplinary` |
| Orientação | `/orientador`, `/orientador/students`, `/orientador/attendance`, `/orientador/grades`, `/orientador/disciplinary` |
| Responsável | `/parent`, `/parent/disciplinary` |
| Aluno | `/student`, `/student/grades`, `/student/attendance`, `/student/assignments` |

As páginas públicas são `/` (apresentação) e `/login`.

## Fluxo de trabalho

Todo trabalho nasce de uma **issue** e entra na `master` por um **Pull Request** ligado a ela (`Closes #N`). O passo a passo está na skill [`fluxo-issue-mr`](.claude/skills/fluxo-issue-mr/SKILL.md):

- Branches: `feature/<n>-<slug>`, `fix/<n>-<slug>` ou `hotfix/<n>-<slug>`
- Commits em Conventional Commits, em português (`feat:`, `fix:`, `docs:`, `ci:`…)
- Nada vai direto para a `master`

## CI/CD

O workflow [`ci-cd.yml`](.github/workflows/ci-cd.yml) roda `npm ci`, lint, testes (quando houver) e build em todo PR e push na `master`. Uma tag `vX.Y.Z` gera uma GitHub Release com o build.

O lint ainda tem pendências herdadas e, por enquanto, não bloqueia o merge.
