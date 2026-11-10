import { randomUUID } from 'node:crypto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

export type CatalogSort = 'featured' | 'name' | 'price_asc' | 'price_desc';
export type CatalogQuery = {
  page: number;
  perPage: number;
  q: string;
  category?: string;
  box?: string;
  sort: CatalogSort;
};

export function invalidQuery(message: string): BadRequestException {
  return new BadRequestException({
    statusCode: 400,
    code: 'INVALID_QUERY',
    message,
    requestId: `req_${randomUUID()}`,
  });
}

export function publicNotFound(): NotFoundException {
  return new NotFoundException({
    statusCode: 404,
    code: 'NOT_FOUND',
    message: 'Conteúdo não encontrado.',
    requestId: `req_${randomUUID()}`,
  });
}

function positiveInteger(
  value: unknown,
  fallback: number,
  maximum: number,
): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw invalidQuery('Informe uma paginação válida.');
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    throw invalidQuery('Informe uma paginação válida.');
  }
  return parsed;
}

function slug(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  if (
    typeof value !== 'string' ||
    value.length > 160 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  ) {
    throw invalidQuery(`Informe ${label} válido.`);
  }
  return value;
}

export function parseCatalogQuery(
  input: Record<string, unknown>,
  kind: 'categories' | 'boxes' | 'products',
): CatalogQuery {
  const allowed = new Set(
    kind === 'categories'
      ? ['page', 'perPage']
      : kind === 'boxes'
        ? ['page', 'perPage', 'q', 'category', 'sort']
        : ['page', 'perPage', 'q', 'category', 'box', 'sort'],
  );
  if (Object.keys(input).some((key) => !allowed.has(key))) {
    throw invalidQuery('Parâmetro de consulta desconhecido.');
  }
  const page = positiveInteger(input.page, 1, 100_000);
  const perPage = positiveInteger(input.perPage, 20, 100);
  if (
    input.q !== undefined &&
    (typeof input.q !== 'string' || input.q.length > 100)
  ) {
    throw invalidQuery('A busca deve ter no máximo 100 caracteres.');
  }
  const q =
    typeof input.q === 'string' ? input.q.trim().replace(/\s+/g, ' ') : '';
  const category = slug(input.category, 'uma categoria');
  const box = slug(input.box, 'um box');
  const validSorts: CatalogSort[] =
    kind === 'products'
      ? ['featured', 'name', 'price_asc', 'price_desc']
      : ['featured', 'name'];
  const sort = input.sort === undefined ? 'featured' : input.sort;
  if (typeof sort !== 'string' || !validSorts.includes(sort as CatalogSort)) {
    throw invalidQuery('Ordenação inválida.');
  }
  return { page, perPage, q, category, box, sort: sort as CatalogSort };
}

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesSearch(
  query: string,
  values: Array<string | null | undefined>,
): boolean {
  if (!query) return true;
  const terms = normalizeSearch(query).split(' ');
  const haystack = normalizeSearch(values.filter(Boolean).join(' '));
  return terms.every((term) => haystack.includes(term));
}

export function paginate<T>(items: T[], page: number, perPage: number) {
  const total = items.length;
  return {
    data: items.slice((page - 1) * perPage, page * perPage),
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  };
}

export function positiveBigIntId(value: string): bigint {
  if (!/^[1-9]\d*$/.test(value)) throw publicNotFound();
  const id = BigInt(value);
  if (id > 9_223_372_036_854_775_807n) throw publicNotFound();
  return id;
}
