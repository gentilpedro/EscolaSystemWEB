import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  BarChart3,
  CheckCircle,
  FileText,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';

const FEATURES = [
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: 'Gestão de Turmas',
    desc: 'Organize turmas, disciplinas e horários de forma simples e centralizada.',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Lançamento de Notas',
    desc: 'Professores lançam notas diretamente no sistema com histórico completo.',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Portal dos Responsáveis',
    desc: 'Pais acompanham desempenho e chamados disciplinares em tempo real.',
  },
  {
    icon: <ClipboardList className="w-6 h-6" />,
    title: 'Controle de Chamada',
    desc: 'Registro digital de presença com alertas automáticos de faltas.',
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: 'Chamados Disciplinares',
    desc: 'Fluxo completo para abertura, acompanhamento e resolução de ocorrências.',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Relatórios e Indicadores',
    desc: 'Dashboards com métricas de desempenho para tomada de decisão ágil.',
  },
];

const PLANS = [
  {
    name: 'Básico',
    price: 'R$99',
    period: '/mês',
    desc: 'Ideal para escolas pequenas com até 200 alunos.',
    features: [
      'Até 200 alunos',
      'Gestão de turmas e chamada',
      'Portal dos responsáveis',
      'Suporte por e-mail',
    ],
    cta: 'Começar',
    highlighted: false,
    badge: null,
  },
  {
    name: 'Profissional',
    price: 'R$199',
    period: '/mês',
    desc: 'O plano mais popular para escolas em crescimento.',
    features: [
      'Até 800 alunos',
      'Tudo do Básico',
      'Lançamento de notas',
      'Chamados disciplinares',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
    cta: 'Começar Agora',
    highlighted: true,
    badge: 'Mais Popular',
  },
  {
    name: 'Enterprise',
    price: 'R$399',
    period: '/mês',
    desc: 'Para redes de ensino com múltiplas unidades.',
    features: [
      'Alunos ilimitados',
      'Tudo do Profissional',
      'Multi-escola',
      'Acesso à API',
      'SLA garantido',
      'Gerente de conta dedicado',
    ],
    cta: 'Falar com Vendas',
    highlighted: false,
    badge: null,
  },
];

const STATS = [
  { value: '500+', label: 'Escolas atendidas' },
  { value: '50 mil', label: 'Alunos no sistema' },
  { value: '98%', label: 'Satisfação dos clientes' },
  { value: '24/7', label: 'Suporte técnico' },
];

export const Home: React.FC = () => {
  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: '#f0f7ff' }}>

      {/* NAVBAR */}
      <header className="w-full bg-white border-b border-[#d9f0ff] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <span className="text-xl font-bold text-[#6f73d2]">EscolaSystem</span>
          </div>

          <nav className="hidden md:flex gap-8 items-center text-sm font-medium text-gray-600">
            <a href="#funcionalidades" className="hover:text-[#6f73d2] transition-colors">
              Funcionalidades
            </a>
            <a href="#precos" className="hover:text-[#6f73d2] transition-colors">
              Preços
            </a>
          </nav>

          <div className="flex gap-3 items-center">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-[#6f73d2] transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/login"
              className="bg-[#6f73d2] hover:bg-[#5a5db8] text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#6f73d2] via-[#7681b3] to-[#83c9f4] text-white py-28">
        <div className="max-w-4xl mx-auto text-center px-6">
          <span className="inline-block bg-white/15 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            🎓 Sistema SaaS de Gestão Escolar
          </span>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            A gestão escolar que<br />sua escola merece
          </h2>
          <p className="text-xl text-white/85 mb-10 max-w-2xl mx-auto leading-relaxed">
            Sistema completo para diretores, professores, alunos e responsáveis.
            Controle tudo em um só lugar, com dados em tempo real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="bg-white text-[#6f73d2] hover:bg-[#d9f0ff] px-8 py-3.5 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2"
            >
              Começar Gratuitamente <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#funcionalidades"
              className="border border-white/40 hover:bg-white/10 text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-colors"
            >
              Ver Funcionalidades
            </a>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-white border-y border-[#d9f0ff]">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-[#6f73d2]">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="funcionalidades" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-800">Tudo que sua escola precisa</h3>
            <p className="text-gray-500 mt-3 text-lg max-w-xl mx-auto">
              Ferramentas pensadas para cada perfil de usuário da comunidade escolar.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 border border-[#d9f0ff] hover:border-[#a3d5ff] hover:shadow-md transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-[#d9f0ff] flex items-center justify-center text-[#6f73d2] mb-4">
                  {f.icon}
                </div>
                <h4 className="font-semibold text-gray-800 text-lg mb-2">{f.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="precos" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-800">Planos para todo tamanho de escola</h3>
            <p className="text-gray-500 mt-3 text-lg">Sem taxas escondidas. Cancele quando quiser.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {PLANS.map((plan) => (
              <Link
                key={plan.name}
                to="/login"
                className={`group relative rounded-2xl p-8 border-2 flex flex-col transition-all hover:shadow-xl ${
                  plan.highlighted
                    ? 'bg-[#6f73d2] border-[#6f73d2] text-white'
                    : 'bg-white border-[#d9f0ff] hover:border-[#a3d5ff] text-gray-800'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#83c9f4] text-[#4e519e] text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </span>
                )}

                <div className="mb-6">
                  <h4 className={`text-xl font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-gray-800'}`}>
                    {plan.name}
                  </h4>
                  <p className={`text-sm mb-4 ${plan.highlighted ? 'text-white/80' : 'text-gray-500'}`}>
                    {plan.desc}
                  </p>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-[#6f73d2]'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm mb-1 ${plan.highlighted ? 'text-white/70' : 'text-gray-400'}`}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle
                        className={`w-4 h-4 shrink-0 ${plan.highlighted ? 'text-[#a3d5ff]' : 'text-[#6f73d2]'}`}
                      />
                      <span className={plan.highlighted ? 'text-white/90' : 'text-gray-600'}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <span
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                    plan.highlighted
                      ? 'bg-white text-[#6f73d2] group-hover:bg-[#d9f0ff]'
                      : 'bg-[#d9f0ff] text-[#6f73d2] group-hover:bg-[#a3d5ff]'
                  }`}
                >
                  {plan.cta} <ArrowRight className="inline w-4 h-4 ml-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20 bg-gradient-to-r from-[#6f73d2] to-[#83c9f4]">
        <div className="max-w-3xl mx-auto text-center px-6 text-white">
          <h3 className="text-4xl font-bold mb-4">Pronto para modernizar sua escola?</h3>
          <p className="text-white/85 text-lg mb-8">
            Junte-se a centenas de escolas que já transformaram sua gestão com o EscolaSystem.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-white text-[#6f73d2] hover:bg-[#d9f0ff] px-10 py-4 rounded-xl font-bold text-base transition-colors"
          >
            Criar conta gratuita <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#2d2f5e] text-white py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <span className="font-bold text-lg">EscolaSystem</span>
          </div>
          <p className="text-white/50 text-sm">© 2026 Pedro Gentil. Todos os direitos reservados.</p>
          <div className="flex gap-6 text-sm text-white/60">
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
