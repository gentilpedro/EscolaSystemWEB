import type { PagedResult } from '../types';

/** Teto de `pageSize` aceito pela API (PagedQuery.MaxPageSize). Pedir mais não traz mais itens. */
export const API_MAX_PAGE_SIZE = 500;

/** Quantas páginas pedir ao mesmo tempo, para não disparar dezenas de requisições juntas. */
const CONCURRENCY = 4;

/**
 * Busca a lista completa de um endpoint paginado: pede a página 1 no tamanho máximo
 * da API e depois as páginas 2..totalPages, juntando tudo. Evita relatórios e
 * contagens calculados sobre dados cortados.
 */
export async function listAll<T>(fetchPage: (page: number, pageSize: number) => Promise<PagedResult<T>>): Promise<PagedResult<T>> {
  const first = await fetchPage(1, API_MAX_PAGE_SIZE);
  // A API devolve o pageSize efetivo; usar ele (e não o pedido) para calcular as páginas
  const pageSize = first.pageSize > 0 ? first.pageSize : API_MAX_PAGE_SIZE;
  const totalPages = Math.max(first.totalPages || 0, Math.ceil(first.totalCount / pageSize));

  const items = [...first.items];
  for (let start = 2; start <= totalPages; start += CONCURRENCY) {
    const pages = [];
    for (let page = start; page < start + CONCURRENCY && page <= totalPages; page++) pages.push(fetchPage(page, pageSize));
    for (const result of await Promise.all(pages)) items.push(...result.items);
  }

  return { items, page: 1, pageSize: items.length, totalCount: first.totalCount, totalPages: 1 };
}
