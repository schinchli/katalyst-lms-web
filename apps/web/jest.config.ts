import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  rootDir: '.',
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // next-sanity ships ESM only — ts-jest cannot parse it; use the stub
    '^next-sanity$': '<rootDir>/src/__mocks__/next-sanity.ts',
    '^@sanity/image-url$': '<rootDir>/src/__mocks__/sanity-image-url.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: { jsx: 'react', esModuleInterop: true },
    }],
  },
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    'src/app/api/**/*.ts',
    'src/hooks/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      functions:  80,
      lines:      80,
      branches:   70,
    },
  },
};

export default config;
