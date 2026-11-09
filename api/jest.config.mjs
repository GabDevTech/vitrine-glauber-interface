import { createDefaultEsmPreset } from 'ts-jest';

export default {
  ...createDefaultEsmPreset(),
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
};
