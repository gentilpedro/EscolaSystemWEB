import type { PagedResult } from '../types';

/**
 * Busca a lista completa de um endpoint paginado: pede uma página grande e,
 * se o total for maior, pede de novo com o tamanho exato. Evita relatórios e
 * contagens calculados sobre dados cortados.
 */
export async function listAll<T>(fetchPage: (page: number, pageSize: number) => Promise<PagedResult<T>>, chunk = 1000): Promise<PagedResult<T>> {
  const first = await fetchPage(1, chunk);
  if (first.totalCount > first.items.length) return fetchPage(1, first.totalCount);
  return first;
}
