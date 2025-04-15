/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest', // Revert to standard ts-jest preset as noted in plan
  testEnvironment: 'node',
  globalSetup: './src/test-utils/jest.globalSetup.ts',
  globalTeardown: './src/test-utils/jest.globalTeardown.ts',
  // extensionsToTreatAsEsm: ['.ts'], // Remove this when not using ESM preset
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8', // or 'babel'
  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>/src'],
  // Explicitly tell Jest (and potentially TS server via Jest extension?) where to find modules
  // moduleDirectories: ['node_modules', '<rootDir>/src'], // Removing temporarily
  // The test matching patterns Jest uses to detect test files
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  // An array of regexp pattern strings that are matched against all test paths before executing the test
  // testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Module name mapper (useful if using path aliases in tsconfig.json)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Setup files to run before each test file (e.g., for environment setup)
  // setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],

  // Transform files with ts-jest
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        // ts-jest configuration options
        tsconfig: 'tsconfig.json',
        // useESM: true, // This should be handled by the 'default-esm' preset
      },
      // Note: resolver was incorrectly placed here
    ],
    // If using ESM, might need to adjust transformIgnorePatterns if dependencies need transforming
    // transformIgnorePatterns: ['/node_modules/(?!some-esm-dependency)'],
  },
  // resolver: './jest.resolver.cjs', // Keep custom resolver removed for now
};