/**
 * Jest mock for next-sanity (ESM-only package that ts-jest cannot parse).
 * Tests never hit Sanity: the client returns empty results.
 */
export const createClient = () => ({
  fetch: async () => [],
});
