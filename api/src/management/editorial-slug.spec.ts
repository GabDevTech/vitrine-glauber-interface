import { describe, expect, it } from '@jest/globals';
import { generateUniqueSlug, slugifyName } from './editorial-slug.js';
import {
  parseBigIntId,
  parseManagementPagination,
  parseReturnComment,
} from './editorial-validation.js';

describe('editorial-slug', () => {
  it('normaliza acentos, espaços e símbolos em português', () => {
    expect(slugifyName('Café & Artesanato — Vitória da Conquista!')).toBe(
      'cafe-artesanato-vitoria-da-conquista',
    );
  });

  it('gera sufixo numérico quando o slug já está ocupado', async () => {
    const taken = new Set(['barro-da-serra', 'barro-da-serra-2']);
    const slug = await generateUniqueSlug('Barro da Serra', (candidate) =>
      Promise.resolve(taken.has(candidate)),
    );
    expect(slug).toBe('barro-da-serra-3');
  });
});

describe('editorial-validation', () => {
  it('valida IDs inteiros positivos', () => {
    expect(parseBigIntId('42')).toBe(42n);
    expect(() => parseBigIntId('abc')).toThrow();
    expect(() => parseBigIntId('0')).toThrow();
  });

  it('valida comentário de devolução entre 5 e 1000 caracteres', () => {
    expect(parseReturnComment({ comment: 'Ajustar foto da capa.' })).toBe(
      'Ajustar foto da capa.',
    );
    expect(() => parseReturnComment({ comment: 'oi' })).toThrow();
  });

  it('valida paginação de gestão com limites 1..100', () => {
    expect(parseManagementPagination({})).toEqual({
      page: 1,
      perPage: 20,
      q: '',
      status: undefined,
    });
    expect(() => parseManagementPagination({ perPage: '101' })).toThrow();
  });
});
