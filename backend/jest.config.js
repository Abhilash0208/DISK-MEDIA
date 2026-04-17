/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch:       ['**/tests/**/*.test.js'],
  setupFiles:      ['dotenv/config'],
  testTimeout:     15000,
  forceExit:       true,
  detectOpenHandles: true
}
