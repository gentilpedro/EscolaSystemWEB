---
name: EscolaSystem
description: Gestão escolar com um portal por perfil, construída sobre o diário de classe, o boletim e o livro de ocorrências.
colors:
  paper: "#f3f5f4"
  surface: "#ffffff"
  sunken: "#eaefec"
  rule: "#d5ddd9"
  rule-strong: "#a7b6af"
  control: "#7f8d87"
  red-wash: "#fdf6f5"
  ink: "#15211c"
  ink-2: "#3e4c46"
  ink-3: "#5b6862"
  lousa: "#1f5c47"
  lousa-hover: "#184a39"
  lousa-tint: "#e2eee8"
  lousa-deep: "#163c30"
  lousa-line: "#2b5a4a"
  chalk: "#e9f0ec"
  chalk-2: "#a9c2b7"
  blue-ink: "#1f4fa3"
  blue-tint: "#e6edf9"
  red-ink: "#b42318"
  red-ink-hover: "#9a1d14"
  red-ink-active: "#7f1810"
  red-tint: "#fbeae8"
  amber-ink: "#8a4b00"
  amber-tint: "#fcf0dc"
typography:
  display:
    fontFamily: "Atkinson Hyperlegible Next Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Atkinson Hyperlegible Next Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Atkinson Hyperlegible Next Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: "Atkinson Hyperlegible Next Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Atkinson Hyperlegible Next Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
  caption:
    fontFamily: "Atkinson Hyperlegible Next Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
  figure:
    fontFamily: "Atkinson Hyperlegible Next Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "\"pnum\", \"lnum\""
  stamp:
    fontFamily: "Atkinson Hyperlegible Next Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1rem
    letterSpacing: "0.06em"
rounded:
  stamp: "3px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.lousa}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.lousa-hover}"
  button-primary-active:
    backgroundColor: "{colors.lousa-deep}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.sunken}"
  button-ghost:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.red-ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-danger-hover:
    backgroundColor: "{colors.red-ink-hover}"
  button-danger-quiet:
    textColor: "{colors.red-ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-sm:
    padding: "0 12px"
    height: "36px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "44px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
  table-head:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink-2}"
    padding: "12px 16px"
  table-cell:
    textColor: "{colors.ink-2}"
    typography: "{typography.body}"
    padding: "12px 16px"
  stamp-pending:
    backgroundColor: "{colors.amber-tint}"
    textColor: "{colors.amber-ink}"
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
    padding: "1px 6px"
  stamp-approved:
    backgroundColor: "{colors.blue-tint}"
    textColor: "{colors.blue-ink}"
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
    padding: "1px 6px"
  stamp-rejected:
    backgroundColor: "{colors.red-tint}"
    textColor: "{colors.red-ink}"
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
    padding: "1px 6px"
  stamp-active:
    backgroundColor: "{colors.lousa-tint}"
    textColor: "{colors.lousa}"
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
    padding: "1px 6px"
  attendance-key:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.sm}"
    size: "40px"
  attendance-key-present:
    backgroundColor: "{colors.blue-ink}"
    textColor: "{colors.surface}"
  attendance-key-absent:
    backgroundColor: "{colors.red-ink}"
    textColor: "{colors.surface}"
  nav-item:
    textColor: "{colors.chalk}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "44px"
  nav-item-active:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.lousa-deep}"
  segmented-active:
    backgroundColor: "{colors.lousa}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    height: "36px"
---

# Design System: EscolaSystem

## Overview

**Creative North Star: "O Diário de Classe"**

O EscolaSystem se veste como o registro escolar brasileiro que ele substitui: papel frio, réguas finas de caderno pautado, régua dupla de livro-registro no topo de cada página, a lousa verde como navegação e três tintas de registro (azul, vermelha, âmbar) que carregam todo o significado de estado. Não é um painel SaaS de cartões coloridos com ícone e número grande; é uma folha de registro onde cada linha é um aluno, uma nota ou uma ocorrência.

A densidade é de ferramenta de uso diário: texto de interface a 15px, linhas de tabela de 48px, alvos de toque de 44px, tudo sobre um único fundo papel com contêineres brancos delimitados por régua, sem sombra. A cor de acento institucional (verde-lousa) é rara no conteúdo: aparece no botão principal, no foco, no item ativo da alternância e na própria lousa lateral. As tintas azul/vermelha/âmbar são reservadas para o registro (presença, nota, situação) e nunca decoram.

A Home pública (superfície de persuasão) usa a mesma identidade, sem um segundo sistema: tipo maior, seções separadas por régua, um diário de chamada real como espécime e um bloco de fechamento em lousa.

**Key Characteristics:**
- Papel frio neutro com contêineres brancos delimitados por réguas de 1px; zero sombra em repouso.
- Régua dupla de 3px sob o título de cada página, como num livro-registro.
- Navegação é a lousa: verde-lousa profundo com texto giz; item ativo vira giz sólido.
- Três tintas de registro com significado fixo: azul = presente/na média; vermelha = falta/nota vermelha/advertência confirmada; âmbar = pendente/atenção. Nos chamados, a tinta segue o desfecho para o aluno, não o verbo da direção.
- Situações são carimbos retangulares em caixa alta, a única caixa alta do sistema.
- Uma só família tipográfica (Atkinson Hyperlegible Next), com algarismos tabulares nos registros e proporcionais nos números em destaque.

## Colors

Uma paleta de papel e tinta: neutros levemente esverdeados, um verde-lousa institucional e três tintas de registro com tons claros pareados.

### Primary
- **Verde-Lousa** (lousa): botão principal, foco (`outline` de 2px), cursor de texto e `accent-color` de controles nativos, alternância ativa, carimbo "Ativo". Estados: **Lousa Escurecida** (lousa-hover) no hover, **Lousa Profunda** (lousa-deep) no pressionado.
- **Lousa Profunda** (lousa-deep): o fundo da navegação lateral, da barra superior no celular e do bloco de fechamento da Home. É a superfície da lousa, não um fundo genérico escuro.
- **Fio da Lousa** (lousa-line): réguas e bordas dentro da lousa (separador do cabeçalho da lateral, borda do botão Sair).
- **Verde Seleção** (lousa-tint): fundo da seleção de texto e do carimbo "Ativo".

### Secondary
- **Giz** (chalk): texto e ícones sobre a lousa; fundo do item de navegação ativo; anel de foco no contexto lousa; marca sobre a lousa.
- **Giz Apagado** (chalk-2): texto secundário sobre a lousa (perfil da sessão, e-mail do usuário, subtítulo do fechamento da Home).

### Tertiary (as tintas do registro)
- **Tinta Azul** (blue-ink) com **Azul Claro** (blue-tint): presente, nota na média (7,0 ou mais), frequência de 75% ou mais, aviso de sucesso.
- **Tinta Vermelha** (red-ink) com **Vermelho Claro** (red-tint): falta, chamado aprovado (advertência confirmada), nota abaixo de 5,0, frequência abaixo de 75%, erro, ações destrutivas, asterisco de obrigatório. Linhas de falta usam **Vermelho Lavado** (red-wash), opaco, para que a coluna fixa da tabela acompanhe. Hover e pressionado em red-ink-hover e red-ink-active, só no botão de perigo.
- **Tinta Âmbar** (amber-ink) com **Âmbar Claro** (amber-tint): pendente, nota de atenção (5,0 a 6,9), avisos.

### Neutral
- **Papel Frio** (paper): fundo de toda página; rodapé de diálogos; linha de tabela no hover.
- **Folha** (surface): fundo de painéis, tabelas, diálogos, campos e botões secundários.
- **Rebaixado** (sunken): cabeçalho de tabela, hover de botões fantasma e de listas, campos somente leitura, etiqueta de perfil.
- **Régua** (rule): bordas de contêiner e divisórias entre linhas.
- **Régua Forte** (rule-strong): linha sob o cabeçalho de tabela, régua dupla do título e réguas decorativas.
- **Borda de Controle** (control, #7f8d87): borda de campos, botões secundários, checkbox, alternância e teclas P/F. 3,4:1 sobre a folha e 3,2:1 sobre o papel (WCAG 1.4.11); a régua forte (2,1:1) não pode ser a única borda de um controle.
- **Tinta** (ink): texto principal. **Tinta 2** (ink-2): texto de corpo em tabelas e descrições. **Tinta 3** (ink-3): rótulos discretos, dicas, numeração de linhas, placeholder.

### Named Rules
**A Regra da Tinta de Registro.** Azul, vermelho e âmbar significam estado do registro e nada mais. Nunca colorir ícones, cartões ou perfis com eles; o perfil do usuário é uma etiqueta neutra (sunken + ink-2), sem arco-íris.

**A Regra Nunca Só Pela Cor.** Todo estado leva também texto ou forma: P/F por letra, carimbo por extenso, nota vermelha sublinhada (2px, deslocamento 4px) e situação por extenso para leitores de tela.

**A Regra da Lousa Rara.** O verde-lousa sólido no conteúdo é para uma ação principal por região e para a seleção ativa. Superfícies inteiras em lousa existem só na navegação e no fechamento da Home.

## Typography

**Display Font:** Atkinson Hyperlegible Next Variable (com ui-sans-serif, system-ui)
**Body Font:** Atkinson Hyperlegible Next Variable (mesma família)

**Character:** Uma família só, auto-hospedada via @fontsource-variable, escolhida por legibilidade para um público de todas as idades. A hierarquia vem de tamanho e peso (400, 600, 700), nunca de uma segunda face. A variante Mono foi testada e descartada porque a vírgula decimal monoespaçada abria vão nas notas; a Next tem algarismos tabulares reais.

### Hierarchy
- **Display** (700, 2.5rem até 3.25rem a partir de 640px, altura 1.08, -0.02em): apenas o título da Home.
- **Headline** (700, 1.75rem até 2rem a partir de 640px, altura 1.25, -0.01em): título de página, sobre a régua dupla. Na Home, títulos de seção em 2rem.
- **Title** (700, 1rem): título de painel; 1.125rem no título de diálogo; 1.25rem nos títulos de registro da Home.
- **Body** (400, 0.9375rem, altura 1.5): o texto de trabalho da interface (tabelas, campos, botões, avisos, descrições). O `body` do documento é 1rem; a Home usa 1.125rem nos parágrafos de abertura, limitados a ~32rem.
- **Label** (600, 0.875rem): rótulos de campo, cabeçalhos de tabela (700), botões pequenos, rótulos de resumo.
- **Caption** (400, 0.8125rem): dicas de campo, mensagens de erro (600, red-ink), e-mail e perfil na lousa, contagens.
- **Figure** (700, 1.75rem, altura 1, algarismos proporcionais): números do resumo onde os números são o conteúdo (painel do aluno, frequência do aluno, relatórios).
- **Stamp** (700, 0.6875rem, +0.06em, caixa alta): somente o carimbo de situação.

### Named Rules
**A Regra dos Dois Algarismos.** Registros (notas em tabela, datas, matrículas, contagens, numeração de linha, paginação) usam algarismos tabulares e alinhados (`.figures`). Números em destaque (notas grandes, totais do resumo) usam proporcionais e alinhados (`.figures-display`), para a vírgula decimal não abrir vão.

**A Regra da Caixa Alta do Carimbo.** Caixa alta com espaçamento existe apenas dentro do carimbo de situação. Títulos, rótulos e cabeçalhos ficam em caixa normal.

## Layout

Coluna de conteúdo única com largura máxima de 1200px no app (1152px na Home), com respiro lateral de 16px no celular, 24px a partir de 640px e 40px a partir de 1024px (vertical 24/32/40px). A lousa ocupa 256px fixos à esquerda a partir de 1024px; abaixo disso vira barra superior de 56px em lousa profunda com gaveta de 288px (no máximo 85% da tela), véu ink a 45% e Esc para fechar.

Cada página abre com o cabeçalho (título à esquerda, ações à direita, quebrando linha em telas estreitas), separado do conteúdo por 24px. A tarefa principal vem logo abaixo: grade de chamada, tabela ou resumo. Barras de filtro quebram linha com espaços de 12px; seções empilham com 24px. Painéis do painel inicial vão em duas colunas a partir de 1024px quando há dois blocos; um bloco só fica limitado a 768px de largura de leitura.

Totais são uma linha no cabeçalho da página, não uma faixa de números, exceto no painel e na frequência do aluno e nos Relatórios, onde a faixa de resumo (2 colunas, 3 ou 4 a partir de 640/1024px, separadas por régua interna) é o conteúdo.

Tabelas rolam na horizontal dentro da própria moldura (largura mínima padrão de 44rem), nunca a página, com a primeira coluna fixa quando necessário. A grade de chamada troca de tabela de 4 colunas (Nº, aluno, presença, observação) para linhas de 3 colunas com a observação embaixo abaixo de 768px, e o rodapé com totais e "Salvar chamada" fica preso ao fim da tela.

## Elevation & Depth

O sistema é plano e pautado: a profundidade vem de tons (papel, folha, rebaixado) e de réguas, não de sombra. Painéis, tabelas, faixas de resumo e listas não têm sombra. Sombra existe só para o que está acima da página (diálogo, aviso flutuante, link "Pular para o conteúdo") e como um toque de 1px nos botões sólidos.

### Shadow Vocabulary
- **Sombra de diálogo** (`box-shadow: 0 18px 48px -12px rgb(21 33 28 / 0.32), 0 2px 6px rgb(21 33 28 / 0.08)`): diálogos modais e avisos flutuantes. O fundo do modal é ink a 45%.
- **Relevo de botão** (`box-shadow: 0 1px 2px rgb(21 33 28 / 0.06)`): botões sólidos primário e de perigo.

### Named Rules
**A Regra da Régua no Lugar da Sombra.** Contêineres em repouso se separam do papel por uma régua de 1px (rule) e pelo branco da folha. Se algo precisa de sombra para se destacar, é uma sobreposição, não um cartão.

## Shapes

Cantos discretos e retangulares, de papelaria: 8px em contêineres (painéis, tabelas, diálogos, faixas de resumo), 6px em controles (botões, campos, avisos, itens de navegação, etiqueta de perfil), 4px nas teclas P/F da chamada e nos botões da alternância, 3px nos carimbos e nas marcas P/F de leitura. Círculo só para avatar, ícone de estado vazio e pontos da linha do tempo.

As bordas são o principal recurso de forma: 1px em contêineres e campos, 1.5px em carimbos e marcas P/F (traço de carimbo), 2px na linha vertical da linha do tempo dos chamados e 3px em linha dupla sob o título da página. A marca EscolaSystem é uma folha de diário pautada com o visto de presença, em quadrado de canto 7/32.

## Components

### Buttons
Firmes e sóbrios; a cor diz a consequência.
- **Shape:** canto de 6px; altura mínima de 44px (o tamanho pequeno só desce para 36px a partir do tablet; botões de ícone 44px no celular e 40px a partir do tablet), peso 600, ícone de 16px com espaço de 8px.
- **Primary:** verde-lousa com texto branco e relevo de 1px; hover lousa-hover, pressionado lousa-deep. Uma por região de ação.
- **Secondary:** folha com borda régua-forte e texto ink; hover rebaixado. Cancelar, "Tentar de novo", ações secundárias.
- **Ghost:** sem fundo, texto ink-2; hover rebaixado.
- **Danger:** tinta vermelha sólida, só dentro de um diálogo de confirmação. **Danger-quiet:** texto vermelho sem fundo, hover em vermelho claro com borda vermelha a 30%.
- **Icon button:** 40px quadrado, nome acessível obrigatório; tons neutro, perigo (vermelho) e positivo (azul).
- **Estados:** desabilitado a 55% de opacidade; carregando troca o ícone por um giro e o rótulo por "Salvando…"; transição de cor de 150ms.

### Stamps (carimbos de situação)
- **Style:** retângulo de canto 3px, borda de 1.5px na tinta a 55%, fundo no tom claro da tinta, texto em caixa alta 11px peso 700.
- **Tons:** âmbar = Pendente; vermelho = Aprovado (advertência confirmada); neutro = Rejeitado (arquivado). Para o responsável os rótulos são "Em análise", "Advertência confirmada" e "Arquivado"; lousa = Ativo/Ativa; neutro (sunken, ink-3) = Inativo e "Exemplo ilustrativo".

### Cards / Containers (Panel)
- **Corner Style:** 8px.
- **Background:** folha sobre papel.
- **Shadow Strategy:** nenhuma (ver Elevation & Depth).
- **Border:** 1px régua; cabeçalho opcional com título de 16px e ação à direita, separado por régua.
- **Internal Padding:** 20px; listas pautadas internas usam linhas de 20px x 14px separadas por régua.

### Inputs / Fields
- **Style:** folha, borda de controle de 1px, canto 6px, altura 44px, texto de 16px no celular (evita o zoom do iOS) e 15px a partir do tablet; rótulo acima (14px, 600) com 6px de espaço.
- **Focus:** borda lousa com anel de 2px em lousa a 25%; hover escurece a borda para ink-3.
- **Error / Disabled:** erro com borda vermelha e mensagem vermelha 13px/600 abaixo, ligada por `aria-describedby`; desabilitado em rebaixado com texto ink-3. Somente leitura é uma caixa rebaixada com borda régua.
- **Busca e filtros:** busca com lupa de 18px à esquerda; filtros com rótulo oculto visualmente, numa barra que quebra linha.

### Tables (tabela pautada)
- Moldura de folha com régua e canto 8px; cabeçalho rebaixado com régua-forte embaixo, 14px/700 em ink-2; células de 15px com 12px x 16px; linhas separadas por régua, hover em papel; linha sinalizada em vermelho claro a 35%.
- Ações de linha alinhadas à direita; a ação destrutiva fica isolada por um separador vertical de 1px.
- Paginação no rodapé: "1–10 de N" e "página / total" em algarismos tabulares.

### Navigation (a lousa)
- Lateral em lousa profunda, 256px, com a marca no topo (64px, régua lousa-line), o perfil da sessão em giz apagado e os itens abaixo.
- Item: 44px, ícone de 20px, texto de 15px em giz a 90%; hover em branco a 10%; ativo em giz sólido com texto lousa profunda em 700.
- Rodapé com avatar circular em giz, nome e e-mail, e botão Sair contornado em lousa-line.
- Foco dentro da lousa usa anel giz em vez de lousa. No celular, barra superior de 56px e gaveta deslizante (200ms).

### Dialogs e avisos
- Diálogo nativo modal: folha, canto 8px, sombra de diálogo, entrada de 200ms (sobe 6px). Cabeçalho com título 18px e fechar; rodapé em papel com botões alinhados à direita (empilhados no celular, ação principal em cima).
- Toda ação destrutiva passa por um diálogo de confirmação próprio, com o botão de perigo e a frase "Esta ação não pode ser desfeita."
- Avisos flutuantes: folha com borda azul (sucesso) ou vermelha (erro), canto 6px, entrada de 220ms; no máximo três; erro fica 7s, sucesso 4s.
- Avisos em linha: borda e fundo no tom da tinta, ícone de 20px, título 600; erro de carregamento sempre com "Tentar de novo" e nunca um zero falso (use "—").

### Segmented (alternância de visão)
- Grupo com borda régua-forte, canto 6px e 4px de respiro; opção de 36px; ativa em verde-lousa com texto branco; contagem em algarismos tabulares.

### Attendance Grid (grade de chamada, assinatura)
- Cada aluno é uma linha numerada com duas teclas P e F de 40px, canto 4px, borda 1.5px. Ativa: P em tinta azul sólida, F em tinta vermelha sólida, texto branco. Inativa: folha, borda régua-forte, letra ink-3.
- Linha com falta ganha fundo vermelho claro a 35%.
- Operável por teclado: setas mudam de aluno, P/F marcam; a dica aparece sob a lista com as teclas desenhadas.
- Rodapé preso com "N presentes · N faltas de N" em tintas azul e vermelha e o botão "Salvar chamada".
- Leitura (fora da edição): marca P/F de 24px, canto 3px, sobre o tom claro da tinta, com "Presente"/"Falta" por extenso.

### Grade Value (nota do boletim)
- Uma casa decimal com vírgula; peso 700; azul a partir de 7,0, âmbar de 5,0 a 6,9, vermelha abaixo de 5,0 com sublinhado. A classificação usa o valor exibido (arredondado), então "7,0" nunca sai em âmbar.

### Call Timeline (linha do tempo do chamado)
- Linha vertical de 2px em régua com pontos de 12px: aberto (ink-3) e decisão (na tinta da situação), com quem e quando em algarismos tabulares e a justificativa citada numa caixa de papel. Nada desaparece: o chamado resolvido mantém o registro.

## Do's and Don'ts

### Do:
- **Do** abrir cada página com o título sobre a régua dupla de 3px (rule-strong) e colocar a tarefa principal logo abaixo.
- **Do** usar azul para presente/na média, vermelho para falta/abaixo de 5,0/advertência confirmada e âmbar para pendente/atenção, sempre com texto ou forma junto.
- **Do** mostrar situações como carimbos retangulares (canto 3px, borda 1.5px, caixa alta 11px).
- **Do** aplicar algarismos tabulares em registros e proporcionais em números em destaque.
- **Do** separar contêineres por régua de 1px sobre papel, sem sombra.
- **Do** isolar a ação destrutiva das vizinhas e confirmá-la num diálogo próprio.
- **Do** mostrar "—" e um aviso com "Tentar de novo" quando um dado falhou ao carregar.
- **Do** manter alvos de 44px em botões, campos e itens de navegação.

### Don't:
- **Don't** montar painéis como mural de cartões coloridos com ícone e número grande; totais vão numa linha no cabeçalho, salvo onde os números são o conteúdo.
- **Don't** colorir perfis, ícones ou seções com as tintas do registro.
- **Don't** pôr sombra em painéis, tabelas ou listas em repouso.
- **Don't** usar caixa alta fora do carimbo de situação.
- **Don't** introduzir uma segunda família tipográfica ou a variante Mono para números.
- **Don't** fazer a página rolar de lado; a tabela rola dentro da moldura.
