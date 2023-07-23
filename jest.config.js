module.exports = {
  clearMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/prisma-mock.ts'],
  exclude: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
};
