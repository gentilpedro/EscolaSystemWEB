import React from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ButtonLink } from '../components/ui';
import { Wordmark } from '../components/layout/BrandMark';

export const NotFound: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { pathname } = useLocation();
  const home = isAuthenticated && user ? `/${user.role}` : '/';

  const content = (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="figures text-6xl font-bold text-ink-3" aria-hidden="true">404</p>
      <h1 className="mt-4 text-2xl font-bold text-ink">Página não encontrada</h1>
      <p className="mt-2 text-[0.9375rem] text-ink-3">
        Não há nada em <span className="figures break-all text-ink-2">{pathname}</span>. Confira o endereço ou volte ao início.
      </p>
      <ButtonLink to={home} className="mt-6" icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}>
        {isAuthenticated ? 'Voltar ao painel' : 'Voltar ao início'}
      </ButtonLink>
    </div>
  );

  // Dentro da área logada já existe a estrutura com navegação
  if (isAuthenticated) return content;

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-4">
      <div className="py-5">
        <Wordmark />
      </div>
      <main className="flex flex-1 items-center justify-center">{content}</main>
    </div>
  );
};
