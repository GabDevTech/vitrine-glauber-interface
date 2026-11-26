import { createDefaultEsmPreset } from 'ts-jest';

export default {
  ...createDefaultEsmPreset(),
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
};
