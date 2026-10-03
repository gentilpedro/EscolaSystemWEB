// Seed de DEMONSTRAÇÃO do EscolaSystem.
//
// Popula uma escola completa chamando a própria API, com os mesmos perfis e regras
// que a interface usa: o admin cria a escola e a direção; a direção cria equipe,
// turmas, alunos e contas; os professores lançam notas, chamada, trabalhos e chamados;
// a direção e a orientação decidem os chamados.
//
// Uso: API_URL=http://localhost:5130/api node docker/seed/demo.mjs
// Se a escola de demonstração já existir, o script não faz nada.

const API = (process.env.API_URL ?? 'http://localhost:5130/api').replace(/\/$/, '');
const ADMIN = { email: 'admin@escolasystem.com', password: 'Admin@123' };
const DEMO_PASSWORD = 'Demo@2026';
const SCHOOL_NAME = 'Escola Estadual Jardim das Flores';

/* ---------------- HTTP ---------------- */

// A API limita 200 requisições/minuto por IP: espaçar as chamadas mantém a seed abaixo disso.
const MIN_INTERVAL_MS = 330;
let lastCall = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function call(method, path, { token, body } = {}) {
  for (let attempt = 1; ; attempt++) {
    const wait = lastCall + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();

    let res;
    try {
      res = await fetch(`${API}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (err) {
      if (attempt >= 30) throw err;
      await sleep(2000); // API ainda subindo
      continue;
    }

    if (res.status === 429 && attempt < 10) {
      const retry = Number(res.headers.get('retry-after')) || 15;
      console.log(`  limite de requisições atingido, aguardando ${retry}s…`);
      await sleep(retry * 1000);
      continue;
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : undefined;
    if (!res.ok) {
      throw new Error(`${method} ${path} → ${res.status}: ${data?.message ?? data?.error ?? text}`);
    }
    return data;
  }
}

async function login(email, password) {
  const data = await call('POST', '/auth/login', { body: { email, password } });
  return data.token;
}

/* ---------------- Dados determinísticos ---------------- */

// Gerador pseudoaleatório com semente fixa: a demo fica igual a cada execução.
let seedState = 20260316;
function random() {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
}
const pick = list => list[Math.floor(random() * list.length)];
const grade = (min, max) => Math.round((min + random() * (max - min)) * 2) / 2; // passos de 0,5

/** Últimos `count` dias úteis antes de hoje, do mais antigo para o mais recente (YYYY-MM-DD). */
function lastSchoolDays(count) {
  const days = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  while (days.length < count) {
    d.setDate(d.getDate() - 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) days.unshift(d.toISOString().slice(0, 10));
  }
  return days;
}

function isoInDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const CLASSES = [
  {
    name: '6º Ano A',
    students: ['Ana Beatriz Moura', 'Bruno Henrique Dias', 'Carla Nogueira', 'Davi Lucas Prado', 'Eduarda Sampaio', 'Felipe Andrade'],
  },
  {
    name: '7º Ano B',
    students: ['Gabriela Torres', 'Heitor Martins', 'Isabela Rocha', 'João Pedro Lima', 'Larissa Campos', 'Miguel Azevedo'],
  },
  {
    name: '8º Ano A',
    students: ['Natália Freitas', 'Otávio Ribeiro', 'Pietra Gomes', 'Rafael Antunes', 'Sofia Barbosa', 'Thiago Cardoso'],
  },
];

const TEACHERS = [
  { name: 'Paulo Mendes', email: 'professor@escolademo.com.br', subjects: ['Matemática', 'Ciências'] },
  { name: 'Juliana Costa', email: 'professora@escolademo.com.br', subjects: ['Português', 'História'] },
];

const slug = name =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')
    .replace(/^\.|\.$/g, '');

/* ---------------- Seed ---------------- */

async function main() {
  console.log(`Seed de demonstração em ${API}`);

  const adminToken = await login(ADMIN.email, ADMIN.password);
  const schools = await call('GET', '/schools?page=1&pageSize=500', { token: adminToken });
  if (schools.items.some(s => s.name === SCHOOL_NAME)) {
    console.log(`A escola "${SCHOOL_NAME}" já existe: seed já aplicada, nada a fazer.`);
    return;
  }

  // 1. Admin: escola e direção
  console.log('1/6 Escola e direção');
  const school = await call('POST', '/schools', {
    token: adminToken,
    body: { name: SCHOOL_NAME, address: 'Rua das Acácias, 120 — Porto Alegre/RS', phone: '(51) 3333-1200', email: 'secretaria@escolademo.com.br' },
  });
  await call('POST', '/users', {
    token: adminToken,
    body: { name: 'Marta Ribeiro', email: 'diretora@escolademo.com.br', password: DEMO_PASSWORD, roleId: 2, schoolId: school.id },
  });
  const directorToken = await login('diretora@escolademo.com.br', DEMO_PASSWORD);

  // 2. Direção: turmas, equipe e vínculos
  console.log('2/6 Turmas, professores e orientação');
  const year = new Date().getFullYear();
  const classes = [];
  for (const c of CLASSES) {
    classes.push({ ...c, entity: await call('POST', '/classes', { token: directorToken, body: { name: c.name, year, schoolId: school.id } }) });
  }

  const teachers = [];
  for (const t of TEACHERS) {
    const user = await call('POST', '/users', {
      token: directorToken,
      body: { name: t.name, email: t.email, password: DEMO_PASSWORD, roleId: 3, schoolId: school.id },
    });
    for (const c of classes) await call('POST', `/users/${user.id}/assign-class/${c.entity.id}`, { token: directorToken });
    teachers.push({ ...t, user });
  }

  const orientador = await call('POST', '/users', {
    token: directorToken,
    body: { name: 'Renata Souza', email: 'orientacao@escolademo.com.br', password: DEMO_PASSWORD, roleId: 6, schoolId: school.id, phone: '(51) 99999-1200' },
  });
  for (const c of classes) await call('POST', `/users/${orientador.id}/assign-orientador-class/${c.entity.id}`, { token: directorToken });

  // 3. Direção: alunos, conta de aluno e responsável
  console.log('3/6 Alunos e contas de aluno e responsável');
  let registration = year * 1000;
  for (const c of classes) {
    c.studentEntities = [];
    for (const name of c.students) {
      registration += 1;
      const birthYear = year - 11 - CLASSES.indexOf(CLASSES.find(x => x.name === c.name));
      const student = await call('POST', '/students', {
        token: directorToken,
        body: {
          name,
          email: `${slug(name)}@aluno.escolademo.com.br`,
          registration: String(registration),
          birthDate: `${birthYear}-0${1 + Math.floor(random() * 9)}-1${Math.floor(random() * 9)}`,
          classId: c.entity.id,
        },
      });
      c.studentEntities.push(student);
    }
  }

  const ana = classes[0].studentEntities[0];
  await call('POST', '/users', {
    token: directorToken,
    body: { name: ana.name, email: 'aluno@escolademo.com.br', password: DEMO_PASSWORD, roleId: 4, schoolId: school.id, studentId: ana.id },
  });
  const parent = await call('POST', '/users', {
    token: directorToken,
    body: { name: 'Carlos Moura', email: 'responsavel@escolademo.com.br', password: DEMO_PASSWORD, roleId: 5, schoolId: school.id },
  });
  await call('POST', `/users/${parent.id}/assign-student/${ana.id}`, { token: directorToken });

  // 4. Professores: notas e chamada
  console.log('4/6 Notas e chamadas');
  const schoolDays = lastSchoolDays(10);
  // Um aluno com frequência baixa e um com notas baixas, para a demo mostrar os alertas
  const lowAttendance = classes[1].studentEntities[1].id; // Heitor Martins
  const lowGrades = classes[2].studentEntities[3].id; // Rafael Antunes

  for (const [ti, t] of teachers.entries()) {
    t.token = await login(t.email, DEMO_PASSWORD);
    for (const c of classes) {
      for (const s of c.studentEntities) {
        for (const subject of t.subjects) {
          for (const period of ['1º Bimestre', '2º Bimestre']) {
            const value = s.id === lowGrades ? grade(2.5, 5.5) : grade(5, 10);
            await call('POST', '/grades', { token: t.token, body: { studentId: s.id, classId: c.entity.id, subject, value, period } });
          }
        }
      }
      // A chamada é do professor da turma; cada professor registra metade dos dias
      const days = schoolDays.filter((_, i) => i % 2 === ti);
      for (const date of days) {
        await call('POST', '/attendance/bulk', {
          token: t.token,
          body: c.studentEntities.map(s => {
            const absent = s.id === lowAttendance ? random() < 0.5 : random() < 0.08;
            return {
              studentId: s.id,
              classId: c.entity.id,
              date,
              isPresent: !absent,
              notes: absent && random() < 0.4 ? pick(['Atestado médico', 'Consulta odontológica', 'Sem justificativa']) : null,
            };
          }),
        });
      }
    }
  }

  // 5. Trabalhos (um já vencido, um com prazo à frente)
  console.log('5/6 Trabalhos');
  const paulo = teachers[0];
  for (const c of classes) {
    for (const s of c.studentEntities) {
      await call('POST', '/pending-works', {
        token: paulo.token,
        body: { studentId: s.id, classId: c.entity.id, title: 'Lista de exercícios de frações', description: 'Exercícios 1 a 20 da página 87.', dueDate: isoInDays(-3) },
      });
      await call('POST', '/pending-works', {
        token: paulo.token,
        body: { studentId: s.id, classId: c.entity.id, title: 'Resumo do capítulo 4 — Ecossistemas', description: 'Resumo de uma página com mapa conceitual.', dueDate: isoInDays(7) },
      });
    }
  }

  // 6. Chamados: abertos pelos professores, decididos pela direção e pela orientação
  console.log('6/6 Chamados disciplinares');
  const juliana = teachers[1];
  const calls = [
    { by: paulo, student: ana, text: 'Uso de celular durante a avaliação de Matemática, mesmo após dois avisos.' },
    { by: juliana, student: classes[1].studentEntities[1], text: 'Faltas recorrentes no primeiro horário sem justificativa dos responsáveis.' },
    { by: juliana, student: classes[2].studentEntities[3], text: 'Discussão com colega durante a aula de História, com troca de ofensas.' },
    { by: paulo, student: classes[1].studentEntities[3], text: 'Saiu da sala sem autorização durante a aula de Ciências.' },
  ];
  const created = [];
  for (const c of calls) {
    created.push(await call('POST', '/disciplinary-calls', { token: c.by.token, body: { studentId: c.student.id, description: c.text } }));
  }
  await call('POST', `/disciplinary-calls/${created[0].id}/approve`, {
    token: directorToken,
    body: { resolution: 'Advertência registrada. Os responsáveis foram comunicados e a avaliação será refeita na próxima semana.' },
  });
  const orientadorToken = await login('orientacao@escolademo.com.br', DEMO_PASSWORD);
  await call('POST', `/disciplinary-calls/${created[3].id}/reject`, {
    token: orientadorToken,
    body: { resolution: 'O aluno tinha autorização da coordenação para ir à enfermaria. Chamado arquivado sem advertência.' },
  });

  console.log('\nSeed concluída. Logins de demonstração (senha de todos: ' + DEMO_PASSWORD + '):');
  console.log('  Administração  admin@escolasystem.com (senha Admin@123)');
  console.log('  Direção        diretora@escolademo.com.br');
  console.log('  Professores    professor@escolademo.com.br · professora@escolademo.com.br');
  console.log('  Orientação     orientacao@escolademo.com.br');
  console.log('  Aluno          aluno@escolademo.com.br');
  console.log('  Responsável    responsavel@escolademo.com.br');
}

main().catch(err => {
  console.error('\nFalha na seed:', err.message);
  process.exit(1);
});
