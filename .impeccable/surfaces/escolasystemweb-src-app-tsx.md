---
version: 1
slug: "escolasystemweb-src-app-tsx"
primary_target: "EscolaSystemWeb/src/App.tsx"
related_targets: ["EscolaSystemWeb/src/pages/Home.tsx","EscolaSystemWeb/src/pages/Login.tsx"]
---

# Surface brief: EscolaSystem web app (todas as rotas)

Scope: app autenticado (Operate) para 6 perfis + Login (limiar) + Home pública (Persuade, mesma identidade).
Audience/job: ver PRODUCT.md. Constraints: rotas, permissões, auth e contratos de API intocados.
Direção pinada pelo usuário ("implemente a nova direção visual proposta"): Diário de Classe. A rolagem (seed 6ed7219f) foi registrada; a direção pinada vence a rolagem.

## Direction contract

THESIS: O sistema fala a língua do registro escolar brasileiro (diário de classe, boletim por bimestre, livro de ocorrências) e recusa o painel SaaS genérico de cards coloridos com ícone e número grande.

OWN-WORLD: Fundo papel frio neutro, tabelas pautadas por réguas finas, cabeçalho de página com régua dupla de livro-registro. A navegação é a lousa: um painel verde-lousa profundo com texto giz. Tinta azul = presente/aprovado/acima da média, tinta vermelha = falta/rejeitado/nota vermelha, âmbar = pendente/atenção. Situações são carimbos retangulares em caixa alta. Atkinson Hyperlegible Next na interface e nos algarismos: tabular-nums em tabelas e datas, proporcionais nos números em destaque.
Emenda (2026-10-03, no build): a Mono foi testada e descartada — a vírgula decimal monoespaçada abria vão nas notas; a Next tem tnum real (verificado).
Emenda (revisão final): painéis abrem na tarefa; totais viram uma linha no cabeçalho (sem faixa de números), exceto no aluno e nos Relatórios, onde os números são o conteúdo.
Raise (do bilhete aéreo, recusado): nada desaparece, se carimba; o chamado resolvido mantém o registro com quem/quando/justificativa numa linha do tempo.
Raise (do console escuro, recusado): ações destrutivas isoladas das vizinhas e sempre confirmadas em diálogo próprio.

STORY: Cada perfil abre na sua tarefa do dia; o professor faz a chamada como num diário; o diretor lê a situação por turma; o responsável vê o que aconteceu e como foi resolvido.

FIRST VIEWPORT: App: lousa à esquerda (lg+) ou barra superior lousa (mobile); título com régua dupla, ações à direita; logo abaixo a tarefa principal (grade de chamada, tabela, resumo). Home: à esquerda nome + promessa + Entrar; à direita um diário de chamada renderizado de verdade (exemplo ilustrativo).

FORM: Diário de Classe (candidato 1 da lista própria; pinado pelo usuário), seed key 6ed7219f. Interação assinatura: chamada como grade P/F operável por teclado (setas + P/F).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
