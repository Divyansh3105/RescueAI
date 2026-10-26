/**
 * The integration tests empty every table. Refuse to start unless DATABASE_URL names a
 * database ending in "_test", so a dev, Neon or default URL can never be wiped.
 */
export function assertTestDatabase(url: string): void {
  const name = new URL(url).pathname.slice(1);
  if (!name.endsWith('_test')) {
    throw new Error(
      `Refusing to run integration tests against database "${name}": its name must end in _test (see docs/TESTING.md).`,
    );
  }
}
