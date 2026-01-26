module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'api/**/*.js',
    '!api/__tests__/**',
    '!api/_lib/**'
  ],
  verbose: true,
  testTimeout: 10000
};
