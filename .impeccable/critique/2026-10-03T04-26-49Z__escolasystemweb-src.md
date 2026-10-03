---
target: frontend inteiro (EscolaSystemWeb/src)
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 11
target_identity: "file:C:\\Users\\genti\\OneDrive\\Desktop\\Projects\\claude\\EscolaSystem\\escolasystemweb\\EscolaSystemWeb\\src"
timestamp: 2026-10-03T04-26-49Z
slug: escolasystemweb-src
---
# Critique — EscolaSystemWeb/src (frontend inteiro) — 2026-10-03
Method: dual-agent (A: design review · B: detector + browser)
Score: 22/40 (Aceitável). H1 2 · H2 3 · H3 1 · H4 3 · H5 2 · H6 2 · H7 2 · H8 3 · H9 2 · H10 2.
Specificity: autoral (diário de classe); coeso visualmente; deriva está no comportamento. Detector CLI 0; overlay: h1→h3 nos cartões de chamado (mobile/parent), sombra no cartão demo da home; dark-glow e nested-cards em thead = falsos positivos. Medições 29 rotas×2: sem overflow, 0 sem nome acessível, 1 h1, skip link ok, Esc ok; alvos <44px em 14 rotas; contraste de texto só falha no "404" (1,93:1).

## Priority issues
- [P0] Retry após falha ao salvar a chamada apaga as marcações (teacher/Attendance.tsx: LoadError → buildAttendanceEntries). Fix: erro junto da barra fixa + "Tentar salvar de novo" → handleSave.
- [P0] Falha ao carregar nova turma mantém alunos da turma anterior e Salvar grava na turma nova (catch não limpa entries). Fix: setEntries([]) + desabilitar Salvar com erro.
- [P1] Sem proteção de alterações não salvas (chamada: trocar turma/dia/sair; diálogos: Esc/fundo).
- [P1] Painéis do professor/orientador não abrem na tarefa; turmas sem links de ação.
- [P1] Notas lançadas uma a uma em modal; criar grade de boletim por turma/disciplina/período.
- [P1] --color-rule-strong #a7b6af = 2,11:1 como única borda de controles (WCAG 1.4.11); token de borda de controle ~#7f8d87.
- [P1] Tinta dos chamados invertida para a família (Aprovado=sanção em azul; Rejeitado=arquivado em vermelho).
- [P1] Mobile: inputs 15px → zoom no iOS; alvos 40/36/28/20px.
- [P1] Busca/filtro de Usuários só na página atual (15).
- [P1] Relatórios/contagens sobre dados truncados (200/500/100/200, chamados sem paginação).
- [P1] Painel do aluno mostra última nota em vez da média.
- [P1] Confirmação de exclusão com autoFocus no botão destrutivo e sem consequência descrita.
- [P1] Ações da tabela escondidas no tablet sem pista de rolagem.
- [P2] Vazios falsos após falha; vínculo de turma cego; desativar sem confirmação; decisão sobre descrição truncada; boletim do aluno (células repetidas, ordenação, hierarquia da média); chamada no mobile 2× alta; datas futuras/fins de semana; métrica de faltas com cores diferentes; disciplina texto livre; "Alterar senha" do admin ambíguo; foco do drawer; redirecionamento para home pública; h1→h3.
- [P3] Retry inconsistente; legenda de notas em lugares diferentes; colunas divergentes; ladrilho de ícone em Minhas turmas; sombra no demo; botão chalk avulso; espaçamentos 20 vs 24; Trabalhos abre em Todos; variantes de Aprovar; 404 contraste; data demo; dica de teclado no mobile; spinner no FormDialog.
- Fora de escopo (funcionalidade nova): vínculo responsável–aluno, criação de trabalhos, perfil/senha para não-admins.

## Personas
Professor no celular: sem "Fazer chamada" no painel; 30 obs vazias; erro fora da tela; retry apaga; › descarta. Alex: notas uma a uma; busca por página; sem deep links. Sam: bordas 2,1:1; foco no excluir; drawer sem trap; role=alert reanunciado. Casey: zoom iOS; alvos 40/36; tabelas sem pista.

## Questions
1. Tinta do chamado deve seguir o desfecho para o aluno? 2. Por que notas ainda são modal? 3. O Painel do professor precisa existir?
