# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Escolas reais (ensino fundamental/médio, Brasil) usando o sistema no dia a dia. Seis perfis, cada um com uma tarefa própria:

- **Professor**: faz a chamada da turma, lança notas por bimestre, abre chamados disciplinares. Uso frequente, muitas vezes em sala, com pressa entre aulas.
- **Diretor**: gerencia funcionários, turmas e alunos da sua escola, acompanha relatórios por turma e aprova/rejeita chamados disciplinares.
- **Orientador**: consulta alunos, faltas e notas das suas turmas; abre e resolve chamados disciplinares.
- **Responsável**: acompanha os chamados disciplinares do(s) filho(s) e a resolução da diretoria.
- **Aluno**: consulta notas, frequência e trabalhos pendentes; marca trabalhos como entregues.
- **Administrador**: gerencia escolas e usuários de toda a rede.

## Product Purpose

Centralizar o registro escolar (chamada, notas, ocorrências, cadastro) que antes vivia em diários de classe, boletins e livros de ocorrência, e dar a cada perfil exatamente a visão de que precisa. Sucesso: o professor faz a chamada em segundos; o diretor enxerga a situação de cada turma; o responsável sabe o que aconteceu e como foi resolvido.

## Positioning

Um sistema multi-escola (SaaS) de gestão escolar com um portal por perfil, construído em torno dos registros que a escola brasileira já conhece: diário de classe (presença P/F), boletim por bimestre, livro de ocorrências com aprovação da diretoria.

## Operating Context

- Ano letivo dividido em 1º–4º Bimestre, mais Recuperação e Final; notas de 0 a 10.
- Frequência mínima de 75% é referência de aprovação.
- Chamados disciplinares: criados por professor/orientador, resolvidos (aprovado/rejeitado com justificativa) pela diretoria ou orientação, visíveis ao responsável.
- Backend próprio (.NET) em `VITE_API_URL` (padrão `http://localhost:5130/api`), autenticação JWT.

## Capabilities and Constraints

- Frontend React + Vite + TypeScript + Tailwind CSS v4, roteamento por perfil (`/admin`, `/director`, `/teacher`, `/orientador`, `/parent`, `/student`).
- Contratos de API, rotas, permissões e autenticação são fixos; mudanças visuais não podem alterá-los.
- Não há cadastro público (auto-cadastro); o acesso é criado pela administração ou diretoria.
- Idioma: português do Brasil.

## Brand Commitments

- Nome: **EscolaSystem**.
- O roxo antigo (`#6f73d2`) **não** é compromisso de marca; pode ser substituído (confirmado pelo usuário em 2026-10-02).

## Evidence on Hand

- Nenhum número de clientes, escolas atendidas, satisfação ou preço confirmado. **Não inventar** estatísticas, depoimentos, planos ou preços (os números antigos da home foram removidos por decisão do usuário em 2026-10-02).
- Credenciais de teste existem só para desenvolvimento e só podem aparecer em modo dev.

## Product Principles

1. Cada perfil abre na sua tarefa, não num mural de números.
2. O registro é a fonte da verdade: estados (presente/ausente, pendente/aprovado/rejeitado, nota abaixo da média) precisam ser inequívocos, nunca só por cor.
3. Dados ausentes ou com erro são ditos como tal; nunca mostrar zero quando a API falhou.
4. Velocidade em tarefas repetidas (chamada, lançamento de notas) vale mais que ornamento.

## Accessibility & Inclusion

Público amplo (alunos, responsáveis de qualquer idade, professores em sala): meta WCAG 2.1 AA, navegação completa por teclado, alvos de toque adequados no celular.
