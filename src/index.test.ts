import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { z } from 'zod/v4-mini';
import { createEnv, EnvValidationError } from './index.js';

const ORIGINAL_ENV = process.env;

describe('createEnv', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });
  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns typed env object when valid (Node.js)', () => {
    process.env.DATABASE_URL = 'https://example.com';
    process.env.PORT = '8080';
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a'.repeat(32);
    const env = createEnv({
      DATABASE_URL: z.string().check(z.url()),
      PORT: z._default(z.coerce.number().check(z.gte(1), z.lte(65535)), 3000),
      NODE_ENV: z.enum(['development', 'production', 'test']),
      JWT_SECRET: z.string().check(z.minLength(32)),
    });
    expect(env.DATABASE_URL).toBe('https://example.com');
    expect(env.PORT).toBe(8080);
    expect(env.NODE_ENV).toBe('production');
    expect(env.JWT_SECRET).toBe('a'.repeat(32));
  });

  it('works with custom envSource (Vite/import.meta.env)', () => {
    const viteEnv = {
      DATABASE_URL: 'https://vite.com',
      PORT: '4000',
      NODE_ENV: 'development',
      JWT_SECRET: 'b'.repeat(32),
    };
    const env = createEnv(
      {
        DATABASE_URL: z.string().check(z.url()),
        PORT: z._default(z.coerce.number().check(z.gte(1), z.lte(65535)), 3000),
        NODE_ENV: z.enum(['development', 'production', 'test']),
        JWT_SECRET: z.string().check(z.minLength(32)),
      },
      { envSource: viteEnv },
    );
    expect(env.DATABASE_URL).toBe('https://vite.com');
    expect(env.PORT).toBe(4000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.JWT_SECRET).toBe('b'.repeat(32));
  });

  it('works with custom envSource (Deno.env.toObject())', () => {
    const denoEnv = {
      DATABASE_URL: 'https://deno.com',
      PORT: '5000',
      NODE_ENV: 'test',
      JWT_SECRET: 'c'.repeat(32),
    };
    const env = createEnv(
      {
        DATABASE_URL: z.string().check(z.url()),
        PORT: z._default(z.coerce.number().check(z.gte(1), z.lte(65535)), 3000),
        NODE_ENV: z.enum(['development', 'production', 'test']),
        JWT_SECRET: z.string().check(z.minLength(32)),
      },
      { envSource: denoEnv },
    );
    expect(env.DATABASE_URL).toBe('https://deno.com');
    expect(env.PORT).toBe(5000);
    expect(env.NODE_ENV).toBe('test');
    expect(env.JWT_SECRET).toBe('c'.repeat(32));
  });

  it('works with custom envSource (Edge/globalThis.env)', () => {
    const edgeEnv = {
      DATABASE_URL: 'https://edge.com',
      PORT: '6000',
      NODE_ENV: 'production',
      JWT_SECRET: 'd'.repeat(32),
    };
    const env = createEnv(
      {
        DATABASE_URL: z.string().check(z.url()),
        PORT: z._default(z.coerce.number().check(z.gte(1), z.lte(65535)), 3000),
        NODE_ENV: z.enum(['development', 'production', 'test']),
        JWT_SECRET: z.string().check(z.minLength(32)),
      },
      { envSource: edgeEnv },
    );
    expect(env.DATABASE_URL).toBe('https://edge.com');
    expect(env.PORT).toBe(6000);
    expect(env.NODE_ENV).toBe('production');
    expect(env.JWT_SECRET).toBe('d'.repeat(32));
  });

  it('throws EnvValidationError on missing env', () => {
    process.env = {};
    expect(() =>
      createEnv({
        DATABASE_URL: z.string().check(z.url()),
      }),
    ).toThrow(EnvValidationError);
  });

  it('throws EnvValidationError on invalid env', () => {
    process.env.DATABASE_URL = 'not-a-url';
    expect(() =>
      createEnv({
        DATABASE_URL: z.string().check(z.url()),
      }),
    ).toThrow(EnvValidationError);
  });

  it('skips validation when skipValidation is true', () => {
    process.env.DATABASE_URL = 'not-a-url';
    process.env.PORT = 'invalid-port';

    const env = createEnv(
      {
        DATABASE_URL: z.string().check(z.url()),
        PORT: z.coerce.number().check(z.gte(1), z.lte(65535)),
      },
      { skipValidation: true },
    );

    expect(env.DATABASE_URL).toBe('not-a-url');
    expect(env.PORT).toBe('invalid-port');
  });

  it('skips validation with custom envSource', () => {
    const invalidEnv = {
      DATABASE_URL: 'not-a-url',
      PORT: 'invalid-port',
    };

    const env = createEnv(
      {
        DATABASE_URL: z.string().check(z.url()),
        PORT: z.coerce.number().check(z.gte(1), z.lte(65535)),
      },
      { envSource: invalidEnv, skipValidation: true },
    );

    expect(env.DATABASE_URL).toBe('not-a-url');
    expect(env.PORT).toBe('invalid-port');
  });

  it('returns frozen object when skipValidation is true', () => {
    process.env.TEST_VAR = 'test';

    const env = createEnv({ TEST_VAR: z.string() }, { skipValidation: true });

    expect(Object.isFrozen(env)).toBe(true);
  });
});
