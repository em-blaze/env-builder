import { z } from 'zod/v4-mini';
import type { $ZodError, $ZodObject } from 'zod/v4/core';

/**
 * Error thrown when environment validation fails
 */
export class EnvValidationError extends Error {
  override name: string = 'EnvValidationError';
  override cause: $ZodError;
  public readonly missing: string[];

  constructor(
    zodError: $ZodError,
    runtimeEnv: Record<string, string | undefined>,
  ) {
    const issues = zodError.issues.map((issue) => {
      const field = issue.path[0] as string;
      const value = runtimeEnv[field];
      if (issue.code === 'invalid_type' && value === undefined) {
        return `  ❌ ${field}: Required`;
      }
      return `  ❌ ${field}: ${issue.message}${value ? ` (got: "${value}")` : ''}`;
    });
    const missing = zodError.issues
      .filter(
        (issue) =>
          issue.code === 'invalid_type' &&
          runtimeEnv[issue.path[0] as string] === undefined,
      )
      .map((issue) => issue.path[0] as string);
    const message = [
      '🚨 Environment validation failed:',
      '',
      ...issues,
      '',
      missing.length > 0 ? `💡 Missing: ${missing.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    super(message);
    this.cause = zodError;
    this.missing = missing;
  }
}

/**
 * Creates a type-safe, runtime-validated environment object from a given source (defaults to process.env)
 * @param schema Zod object schema describing required env vars
 * @param options Optional object: { envSource?: Record<string, unknown> }
 * @returns Typed, immutable env object
 * @throws EnvValidationError if validation fails
 *
 * @example
 * import { z, createEnv } from 'env-builder';
 *
 * export const env = createEnv({
 *   DATABASE_URL: z.string().check(z.url()),
 *   PORT: z._default(z.coerce.number().check(z.gte(1), z.lte(65535)), 3000),
 *   NODE_ENV: z.enum(['development', 'production', 'test']),
 *   JWT_SECRET: z.string().check(z.minLength(32)),
 * });
 *
 * // For custom sources (e.g., edge, Deno, import.meta.env):
 * // createEnv(schema, { envSource: import.meta.env })
 */
export function createEnv<T extends Record<string, z.ZodMiniType<any, any>>>(
  schema: T,
  options?: { envSource?: Record<string, unknown> },
): z.infer<$ZodObject<T>> {
  const zodSchema = z.object(schema);
  const envSource = options?.envSource ?? process.env;
  const parseResult = zodSchema.safeParse(envSource);
  if (!parseResult.success) {
    throw new EnvValidationError(
      parseResult.error,
      envSource as Record<string, string | undefined>,
    );
  }
  const validated = parseResult.data;
  Object.freeze(validated);
  return validated;
}

/**
 * Type utility for inferring the env type
 */
export type InferEnv<T extends ReturnType<typeof createEnv>> = T;
