import { BadRequestException } from '@nestjs/common';
import { matchesSearch, paginate, parseCatalogQuery } from './public-query.js';

describe('Public catalog query rules', () => {
  it('matches searches regardless of accents and letter case', () => {
    expect(matchesSearch('SERTAO', ['Sabores do Sertão'])).toBe(true);
    expect(matchesSearch('cafe planalto', ['Café do Planalto'])).toBe(true);
    expect(matchesSearch('ceramica', ['Sabores do Sertão'])).toBe(false);
  });

  it('rejects invalid pagination and unsupported sorting', () => {
    expect(() => parseCatalogQuery({ page: '0' }, 'boxes')).toThrow(
      BadRequestException,
    );
    expect(() => parseCatalogQuery({ perPage: '101' }, 'products')).toThrow(
      BadRequestException,
    );
    expect(() => parseCatalogQuery({ sort: 'price_asc' }, 'boxes')).toThrow(
      BadRequestException,
    );
  });

  it('returns consistent pagination metadata', () => {
    expect(paginate(['a', 'b', 'c'], 2, 2)).toEqual({
      data: ['c'],
      meta: { page: 2, perPage: 2, total: 3, totalPages: 2 },
    });
  });
});
