import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // TESTING.md: test files sit next to the code they cover (D-038).
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // Integration tests share one real database, so files run one at a time.
    globalSetup: ['src/test/global-setup.ts'],
    fileParallelism: false,
  },
});
