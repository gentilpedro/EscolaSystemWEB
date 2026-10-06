/** Mensagem de erro vinda da API (Error.message) ou um texto padrão. */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
