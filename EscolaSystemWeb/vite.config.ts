import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

// A versão mostrada em Configurações acompanha o package.json (atualizar junto com a tag do release)
const appVersion: string = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')).version

/**
 * Content-Security-Policy do build: scripts, estilos e fontes só da própria origem, chamadas só para a API.
 * Limita o estrago de um script injetado (XSS). Fica fora do `vite dev`, que precisa de scripts inline para o HMR.
 * Em produção, o servidor que entrega o `dist/` deve mandar o mesmo cabeçalho (ver README).
 */
function contentSecurityPolicy(apiUrl: string): string {
  const apiOrigin = new URL(apiUrl).origin
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self' ${apiOrigin}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:5130/api'

  return {
    plugins: [react()],
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    server: {
      port: 3000,
      open: true,
    },
    preview: {
      headers: {
        'Content-Security-Policy': contentSecurityPolicy(apiUrl),
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    },
  }
})
