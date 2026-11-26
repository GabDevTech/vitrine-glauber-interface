import { describe, expect, it } from '@jest/globals';
import {
  sanitizeFilename,
  validateMediaKind,
} from './management-media.service.js';

describe('management-media helpers', () => {
  it('aceita apenas kinds válidos', () => {
    expect(validateMediaKind('box_cover')).toBe('box_cover');
    expect(validateMediaKind('box_owner_portrait')).toBe('box_owner_portrait');
    expect(validateMediaKind('product_image')).toBe('product_image');
    expect(() => validateMediaKind('invalid_kind')).toThrow();
  });

  it('sanitiza nomes de arquivo removendo caminhos', () => {
    expect(sanitizeFilename('../../foto do box!.png')).toBe('....foto do box_.png');
    expect(sanitizeFilename(undefined)).toBe('imagem');
  });
});
