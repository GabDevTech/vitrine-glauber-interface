import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';

export type JsonBody = Record<string, unknown>;
export type FieldErrors = Record<string, string[]>;

export function addFieldError(
  errors: FieldErrors,
  field: string,
  message: string,
): void {
  if (!errors[field]) errors[field] = [];
  errors[field].push(message);
}

export function throwIfValidationErrors(errors: FieldErrors): void {
  if (Object.keys(errors).length > 0) {
    throw new UnprocessableEntityException({
      code: 'VALIDATION_ERROR',
      message: 'Confira os dados informados.',
      details: errors,
    });
  }
}

export function parseBigIntId(raw: string, field = 'id'): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new BadRequestException({
      code: 'INVALID_ID',
      message: `Identificador inválido para ${field}.`,
    });
  }
  const value = BigInt(raw);
  if (value <= 0n) {
    throw new BadRequestException({
      code: 'INVALID_ID',
      message: `Identificador inválido para ${field}.`,
    });
  }
  return value;
}

export function parseOptionalBigInt(
  value: unknown,
  field: string,
  errors: FieldErrors,
): bigint | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return BigInt(value);
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = BigInt(value.trim());
    if (parsed > 0n) return parsed;
  }
  addFieldError(errors, field, 'Informe um identificador válido.');
  return undefined;
}

export function parsePositiveInt(
  value: unknown,
  field: string,
  errors: FieldErrors,
): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1) {
    return value;
  }
  addFieldError(errors, field, 'Informe um número inteiro positivo.');
  return undefined;
}

export function parseOptionalString(
  value: unknown,
  field: string,
  min: number,
  max: number,
  errors: FieldErrors,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    addFieldError(errors, field, 'Informe um texto válido.');
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const len = [...trimmed].length;
  if (len < min || len > max) {
    addFieldError(errors, field, `Informe entre ${min} e ${max} caracteres.`);
    return undefined;
  }
  return trimmed;
}

export function parseReturnComment(body: JsonBody): string {
  const errors: FieldErrors = {};
  const raw = body.comment;
  if (typeof raw !== 'string') {
    addFieldError(errors, 'comment', 'Informe entre 5 e 1000 caracteres.');
    throwIfValidationErrors(errors);
  }
  const trimmed = (raw as string).trim();
  const len = [...trimmed].length;
  if (len < 5 || len > 1000) {
    addFieldError(errors, 'comment', 'Informe entre 5 e 1000 caracteres.');
    throwIfValidationErrors(errors);
  }
  return trimmed;
}

export function parseManagementPagination(query: Record<string, unknown>): {
  page: number;
  perPage: number;
  q: string;
  status?: string;
} {
  const rawPage = query.page;
  const rawPerPage = query.perPage;
  const page =
    rawPage === undefined || rawPage === ''
      ? 1
      : Number.parseInt(String(rawPage), 10);
  const perPage =
    rawPerPage === undefined || rawPerPage === ''
      ? 20
      : Number.parseInt(String(rawPerPage), 10);
  if (!Number.isInteger(page) || page < 1) {
    throw new BadRequestException({
      code: 'INVALID_QUERY',
      message: 'Parâmetro page inválido.',
    });
  }
  if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100) {
    throw new BadRequestException({
      code: 'INVALID_QUERY',
      message: 'Parâmetro perPage deve ficar entre 1 e 100.',
    });
  }
  const q = typeof query.q === 'string' ? query.q.trim() : '';
  const status =
    typeof query.status === 'string' && query.status.trim()
      ? query.status.trim()
      : undefined;
  return { page, perPage, q, status };
}

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim();
}
