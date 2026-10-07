import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const APP_NAME = 'EscolaSystem';
// A tela pode estar carregando: espera o título principal aparecer por até 3 s
const WAIT_STEP_MS = 100;
const WAIT_MAX_TRIES = 30;

/**
 * A cada troca de tela, usa o título principal (h1) como título da aba ("Escolas · EscolaSystem")
 * e leva o foco até ele, para o leitor de tela anunciar a tela nova.
 * Na primeira carga o foco não muda: o link "Pular para o conteúdo" continua sendo o primeiro.
 */
export const RouteAnnouncer: React.FC = () => {
  const { pathname } = useLocation();
  // Caminho da primeira carga: enquanto a pessoa não sair dele, o foco não é mexido
  const initialPath = useRef(pathname);
  const navigated = useRef(false);

  useEffect(() => {
    // Decide pelo caminho, não por "já rodou": o efeito pode rodar duas vezes (StrictMode), e a pessoa
    // pode navegar antes de a primeira tela terminar de carregar
    if (pathname !== initialPath.current) navigated.current = true;
    const isFirstLoad = !navigated.current;
    let tries = 0;
    let timer = 0;

    const apply = () => {
      const heading = document.querySelector<HTMLElement>('main h1') ?? document.querySelector<HTMLElement>('h1');
      if (!heading && tries++ < WAIT_MAX_TRIES) {
        timer = window.setTimeout(apply, WAIT_STEP_MS);
        return;
      }
      const name = heading?.textContent?.trim();
      document.title = name ? `${name} · ${APP_NAME}` : APP_NAME;
      if (heading && !isFirstLoad) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    };

    timer = window.setTimeout(apply, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
};
