const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^mermaid$': '<rootDir>/src/__mocks__/mermaid.js',
    '^@noble/ed25519$': '<rootDir>/src/__mocks__/@noble/ed25519.js',
    '^@noble/hashes/sha2.js$': '<rootDir>/src/__mocks__/@noble/hashes/sha2.js',
    '^react-markdown$': '<rootDir>/src/__mocks__/react-markdown.js',
    '^rehype-raw$': '<rootDir>/src/__mocks__/rehype-raw.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(mermaid|@noble|react-markdown|rehype-raw)/)'
  ],
}

module.exports = createJestConfig(customJestConfig)