// jest.config.js
const nextJest = require('next/jest')

// Provide the path to your Next.js app to load next.config.js and .env files in your test environment
const createJestConfig = nextJest({
  dir: './',
})

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Points to the setup file we'll create next

  testEnvironment: 'jest-environment-jsdom', // Use jsdom environment for browser-like testing

  // Handle module aliases (adjust if your tsconfig.json uses different paths)
  moduleNameMapper: {
    '^components/(.*)$': '<rootDir>/components/$1',
    '^app/(.*)$': '<rootDir>/app/$1',
    '^lib/(.*)$': '<rootDir>/lib/$1',
    '^context/(.*)$': '<rootDir>/context/$1',
    '^graphql/(.*)$': '<rootDir>/graphql/$1',
    // Mock CSS Modules
    '\\.css$': 'identity-obj-proxy',
  },

  // Use ts-jest for TypeScript files
  preset: 'ts-jest',

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true, // Optional: enable coverage reporting

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage", // Optional: specify coverage directory

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [ // Optional: configure which files to include/exclude
      'app/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'lib/**/*.{ts,tsx}',
      'context/**/*.{ts,tsx}',
      '!**/node_modules/**',
      '!**/.next/**',
      '!**/coverage/**',
      '!jest.config.js',
      '!jest.setup.js',
      // Add any other files/directories to exclude
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)