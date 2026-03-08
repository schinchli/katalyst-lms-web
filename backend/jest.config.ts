import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/lambdas'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['lambdas/**/index.ts'],
  coverageThreshold: {
    global: { branches: 80, functions: 100, lines: 90, statements: 90 },
  },
  coverageReporters: ['text', 'lcov'],
};

export default config;
