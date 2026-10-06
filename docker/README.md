# Ambiente de demonstração (Docker)

Sobe o EscolaSystem completo, com banco, API e front, já populado com uma escola de exemplo. Serve para demonstrações e para testar o front contra a API real. As chaves e senhas são só para uso local.

## Pré-requisitos

- Docker com Compose v2
- O repositório da API clonado **ao lado** deste, com o nome `escolasystemapi`:

```
EscolaSystem/
├── escolasystemapi/   # github.com/gentilpedro/EscolaSystemAPI
└── escolasystemweb/   # este repositório
```

Não é preciso ter .NET, Node ou PostgreSQL instalados. O compose usa as imagens oficiais e roda o código direto dos dois repositórios.

## Subir

Na raiz deste repositório:

```bash
docker compose up -d
```

A primeira vez demora alguns minutos por causa do restore do .NET e do `npm ci`; as dependências ficam em volumes de cache para as próximas vezes. A seed roda sozinha depois que a API fica pronta. Acompanhe com:

```bash
docker compose logs -f seed
```

| Serviço | Endereço |
|---|---|
| Front | http://localhost:3000 |
| API | http://localhost:5130 (documentação em http://localhost:5130/scalar/v1) |
| Banco | `localhost:5434`, banco `EscolaSystem`, usuário `escolasystem`, senha `escolasystem-demo` |

O banco usa a porta 5434 no host para não colidir com um PostgreSQL local na 5432.

## Logins de demonstração

Senha de todos: `Demo@2026` (o admin usa `Admin@123`).

| Perfil | E-mail |
|---|---|
| Administração | `admin@escolasystem.com` |
| Direção | `diretora@escolademo.com.br` |
| Professores | `professor@escolademo.com.br` (Matemática e Ciências) · `professora@escolademo.com.br` (Português e História) |
| Orientação | `orientacao@escolademo.com.br` |
| Aluno | `aluno@escolademo.com.br` (Ana Beatriz Moura, 6º Ano A) |
| Responsável | `responsavel@escolademo.com.br` (responsável pela Ana) |

## O que a seed cria

A seed (`docker/seed/demo.mjs`) usa a própria API, com as mesmas regras de perfil da interface:

- Escola Estadual Jardim das Flores, com direção, dois professores e orientação vinculados às turmas
- Três turmas (6º Ano A, 7º Ano B e 8º Ano A), com seis alunos cada
- Conta de aluno para a Ana e conta de responsável vinculada a ela
- Notas do 1º e do 2º trimestre nas quatro disciplinas
- Chamada dos últimos 10 dias úteis, incluindo um aluno com frequência baixa
- Dois trabalhos por aluno: um vencido e um com prazo à frente
- Quatro chamados disciplinares: dois pendentes, um aprovado pela direção e um rejeitado pela orientação

Os dados são fixos e se repetem a cada ambiente novo. Se a escola de demonstração já existir, a seed não faz nada. Para rodar de novo num banco que já tem a seed:

```bash
docker compose run --rm seed
```

## Recomeçar do zero

```bash
docker compose down -v   # remove containers e o volume do banco (os caches também)
docker compose up -d
```

## Atualizar depois de mudar o código

O front e a API são copiados para dentro dos containers quando eles iniciam. Depois de mudar o código:

```bash
docker compose restart web    # ou: api
```
