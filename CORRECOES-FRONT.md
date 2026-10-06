# Correções pendentes do front

Levantadas na auditoria de compatibilidade entre o EscolaSystemWeb e a EscolaSystem API (outubro de 2026). Cada item vira uma issue própria, seguindo o `fluxo-issue-mr`.

Para começar, a API do `master` precisa ter os PRs [#7](https://github.com/gentilpedro/EscolaSystemAPI/pull/7), [#9](https://github.com/gentilpedro/EscolaSystemAPI/pull/9) e [#11](https://github.com/gentilpedro/EscolaSystemAPI/pull/11) mergeados. Vários itens abaixo dependem do que eles acrescentam.

Decisões já tomadas:

- Contas de **aluno** e **responsável** são criadas pelo **diretor**. O admin cria só Administradores e Diretores.
- **Excluir usuário** continua sendo desativação, para preservar o histórico. O front muda só o texto.

## Prioridade crítica

### 1. ~~Corrigir o build~~ (resolvido na reformulação)
O erro de tipo em `pages/admin/Users.tsx` foi corrigido antes do commit da reformulação; `tsc -b` e `npm run build` passam.

### 2. ~~Apontar para a porta certa da API~~ (resolvido na #3)
- **Onde:** `src/services/api.ts:3`
- **Problema:** sem `VITE_API_URL`, o padrão é `http://localhost:3001/api`. A API roda em `http://localhost:5130`.
- **Correção:** trocar o padrão para `http://localhost:5130/api`, como diz o `PRODUCT.md`, e versionar um `.env.example` com `VITE_API_URL=http://localhost:5130/api`.
- **Aceite:** com o repositório recém-clonado e sem `.env`, o login funciona contra a API local.

### 3. ~~Cadastro de aluno e responsável pelo diretor~~ (resolvido na #16)
- **Onde:** `src/pages/director/Students.tsx` e `src/pages/admin/Users.tsx`
- **Problema:** nenhuma tela cria conta de aluno ou de responsável nem vincula o responsável ao aluno. `userApi.assignStudent` existe, mas não é usado. O formulário do admin oferece esses perfis e a API responde 403.
- **Correção:**
  - Em Diretor › Alunos, ação **Criar acesso do aluno**: `POST /api/users` com `roleId: 4`, `schoolId` do diretor e `studentId` do aluno.
  - Ação **Adicionar responsável**: `POST /api/users` com `roleId: 5`, seguido de `POST /api/users/{parentId}/assign-student/{studentId}`. Permitir também vincular um responsável já cadastrado.
  - Em Admin › Usuários, oferecer só **Administrador** e **Diretor**, com Diretor como padrão.
- **Aceite:** o diretor dá acesso a um aluno e a um responsável, e os dois conseguem logar e ver os seus dados.

### 4. ~~Paginação real em vez de listas cortadas~~ (resolvido na #5)
- **Onde:** `src/lib/paging.ts`, usado agora por quase todas as telas (painéis, relatórios, chamada, notas, ocorrências)
- **Problema:** a API limita `pageSize` a 500. O `listAll` pede 1000 e, se faltar, repete com `pageSize = totalCount`, que a API também corta em 500. Ele nunca pede a página 2. Teste real: 500 de 600 presenças. Como a reformulação passou a usar o `listAll` em todo lugar, o corte atinge todas essas telas.
- **Correção:** o `listAll` percorre `page = 1..totalPages` com `pageSize = 500` e junta os itens.
- **Aceite:** com mais de 500 registros, a tela mostra o total igual ao `totalCount` da API.

## Prioridade alta

### 5. Relatórios e painéis calculados pela API
- **Onde:** `pages/director/Reports.tsx`, `pages/director/Dashboard.tsx`, `pages/teacher/Dashboard.tsx`, `pages/orientador/Dashboard.tsx`, `pages/student/Dashboard.tsx`
- **Problema:** os painéis e o relatório baixam todas as notas, presenças e ocorrências da escola para somar no navegador. Funciona em escola pequena, mas fica lento à medida que o histórico cresce, e herda o corte do item 4.
- **Correção:**
  - Relatórios: `GET /api/reports/classes` (alunos, média, frequência e ocorrências por turma).
  - Painéis: `GET /api/dashboard/stats` (turmas, alunos, funcionários, ocorrências pendentes, trabalhos pendentes, média e frequência no escopo do usuário).
  - Lista de pendentes: `GET /api/disciplinary-calls?status=1`.
- **Aceite:** os números batem com o banco, independentemente do tamanho da escola.

### 6. ~~Senha errada mostra a mensagem~~ (resolvido na #7)
- **Onde:** `src/services/api.ts` (tratamento de 401)
- **Problema:** todo 401 limpa o token e faz `window.location.href = '/login'`. No login com senha errada, a página recarrega e "Credenciais inválidas" some.
- **Correção:** não redirecionar quando a requisição é `/auth/login`. Nas demais, redirecionar só se havia sessão.
- **Aceite:** senha errada mostra a mensagem da API. Conta bloqueada mostra o tempo de espera (429, PR #9).

### 7. ~~Mostrar a mensagem da API nas ações destrutivas~~ (resolvido na #16 e na #18)
- **Onde:** `admin/Schools.tsx`, `admin/Users.tsx`, `director/Classes.tsx`, `director/Staff.tsx`, `director/Students.tsx`, `teacher/Grades.tsx`
- **Problema:** excluir, ativar e desativar usam `catch {}` com texto fixo e escondem o motivo, por exemplo "a turma possui alunos, desative em vez de excluir".
- **Correção:** `toast.error(errorMessage(err, '…'))`, como os formulários já fazem. Com o PR #7, os erros 401, 403 e 400 também trazem `message`.
- **Aceite:** excluir uma turma com alunos mostra a orientação da API.

### 8. ~~Logout encerra a sessão na API~~ (resolvido na #14)
- **Onde:** `src/contexts/AuthContext.tsx` (`logout`)
- **Problema:** só apaga o token local. O token continua válido até expirar.
- **Correção:** chamar `authApi.logout()` (`POST /api/auth/logout`) antes de limpar a sessão, ignorando falha de rede.
- **Aceite:** depois de sair, o token antigo recebe 401.

## Prioridade média

### 9. ~~Chamada e notas só com alunos ativos~~ (resolvido na #20)
- **Onde:** `pages/teacher/Attendance.tsx`, `pages/teacher/Grades.tsx`, `pages/teacher/Classes.tsx`
- **Problema:** aluno desativado aparece na chamada e recebe falta todo dia.
- **Correção:** `GET /api/students?classId=…&isActive=true` (PR #11).
- **Aceite:** aluno desativado some da chamada; o histórico dele continua nas consultas.

### 10. ~~"Excluir usuário" diz o que acontece~~ (resolvido na #16)
- **Onde:** `admin/Users.tsx`, `director/Staff.tsx`
- **Problema:** a API desativa a conta, mas o front avisa "Usuário excluído" e a pessoa reaparece como inativa.
- **Correção:** renomear a ação para **Desativar** e a mensagem para "{nome} foi desativado".

### 11. ~~Filtros e busca no servidor~~ (resolvido na #16, com `search` e `isActive` da API #16)
- **Onde:** `admin/Users.tsx`, `director/Staff.tsx`
- **Problema:** com a reformulação, a busca já usa a lista inteira via `listAll`, mas baixa todos os usuários para filtrar no navegador.
- **Correção:** enviar `roleId` e `schoolId` em `GET /api/users`. A busca por nome no servidor ainda não existe na API.

### 12. ~~Tela de trabalhos do professor~~ (resolvido na #20)
- **Onde:** novo, em `pages/teacher/`
- **Problema:** nenhuma tela cria trabalhos, então o portal do aluno fica sempre vazio.
- **Correção:** formulário que chama `POST /api/pending-works` para cada aluno ativo da turma.

### 13. ~~Notas sem duplicidade e período validado~~ (resolvido na #18)
- **Onde:** `pages/teacher/Grades.tsx`
- **Contexto:** com o PR #11, a API devolve 409 para a mesma matéria e período e 400 para período fora da lista.
- **Correção:** mostrar a mensagem da API e, ao lançar, oferecer editar a nota existente.

### 14. ~~Senha com a mesma regra da API~~ (resolvido na #16)
- **Onde:** `pages/admin/Settings.tsx` e formulários de usuário
- **Problema:** o front aceita 6 caracteres; a API exige 8, com maiúscula, minúscula, número e símbolo.
- **Correção:** validar a mesma regra antes de enviar.

### 15. ~~Vínculos visíveis no modal de turmas~~ (resolvido na #16)
- **Onde:** `pages/director/Staff.tsx` (`AssignClassModal`)
- **Problema:** o modal não mostra as turmas já vinculadas.
- **Correção:** usar `classIds` de `GET /api/users`, que a API já devolve.

## Prioridade baixa

### 16. ~~Credenciais de teste corretas no login~~ (resolvido na #14)
- **Onde:** `pages/Login.tsx:102`
- **Problema:** mostra `admin@escolar.com`; o usuário semeado é `admin@escolasystem.com` / `Admin@123`.

### 17. Qualidade do repositório
- Avisos de lint herdados, a maioria `any` no `api.ts`. Tipar a partir do OpenAPI da API (`/openapi/v1.json`).
- Remover de `types/index.ts` os tipos antigos sem uso (`Class`, `Student`, `Grade`, `Attendance`, `DisciplinaryReport`), que têm campos diferentes dos da API.
- O CI já existe (`.github/workflows/ci-cd.yml`) e o build passa. Falta tornar o lint bloqueante e o check obrigatório na proteção do `master`.
- Avaliar trocar o token em `localStorage` por cookie httpOnly.
- O repositório tem uma branch `main` sem histórico comum com o `master`, com commits de CI antigos. A branch padrão é o `master`; decidir se a `main` deve ser apagada.
