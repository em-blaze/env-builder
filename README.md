# @kastia/env

A lightweight, type-safe environment variable builder with runtime validation.

[![npm version](https://badge.fury.io/js/@kastia%2Fenv.svg)](https://badge.fury.io/js/@kastia%2Fenv)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔒 **Type-safe** - Full TypeScript support with inferred types
- ⚡ **Lightweight** - Minimal dependencies, powered by Zod v4-mini
- 🌍 **Universal** - Works with Node.js, Deno, Bun, and edge runtimes
- 🛡️ **Validation** - Runtime validation with helpful error messages
- 🚀 **Flexible** - Support for custom env sources and skip validation
- ❄️ **Immutable** - Returns frozen objects to prevent accidental mutations

## Installation

```bash
npm install @kastia/env zod
```

## Quick Start

```typescript
import { z } from 'zod/v4-mini';
import { createEnv } from '@kastia/env';

const env = createEnv({
  DATABASE_URL: z.string().check(z.url()),
  PORT: z._default(z.coerce.number().check(z.gte(1), z.lte(65535)), 3000),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  JWT_SECRET: z.string().check(z.minLength(32)),
});

// env is now fully typed and validated!
console.log(env.DATABASE_URL); // string (validated URL)
console.log(env.PORT); // number (defaults to 3000)
console.log(env.NODE_ENV); // 'development' | 'production' | 'test'
```

## Advanced Usage

### Custom Environment Sources

Perfect for different runtimes and frameworks:

```typescript
// Vite/Rollup (import.meta.env)
const env = createEnv(schema, { 
  envSource: import.meta.env 
});

// Deno
const env = createEnv(schema, { 
  envSource: Deno.env.toObject() 
});

// Edge runtime
const env = createEnv(schema, { 
  envSource: globalThis.env 
});
```

### Skip Validation

Useful for development, testing, or when you need to bypass validation:

```typescript
// Skip validation entirely
const env = createEnv(schema, { 
  skipValidation: true 
});

// Combine with custom source
const env = createEnv(schema, { 
  envSource: testEnv,
  skipValidation: process.env.NODE_ENV === 'test'
});
```

### Error Handling

The library provides detailed error messages for debugging:

```typescript
try {
  const env = createEnv({
    DATABASE_URL: z.string().check(z.url()),
    PORT: z.coerce.number().check(z.gte(1), z.lte(65535)),
  });
} catch (error) {
  if (error instanceof EnvValidationError) {
    console.log(error.message);
    // 🚨 Environment validation failed:
    // 
    //   ❌ DATABASE_URL: Required
    //   ❌ PORT: Number must be greater than or equal to 1 (got: "0")
    // 
    // 💡 Missing: DATABASE_URL
    
    console.log(error.missing); // ['DATABASE_URL']
  }
}
```

## API Reference

### `createEnv(schema, options?)`

Creates a type-safe, validated environment object.

#### Parameters

- **`schema`** - Zod object schema defining your environment variables
- **`options`** (optional)
  - **`envSource`** - Custom environment source (defaults to `process.env`)
  - **`skipValidation`** - Skip validation and return raw values (defaults to `false`)

#### Returns

A frozen, typed object containing your environment variables.

#### Throws

`EnvValidationError` when validation fails (unless `skipValidation` is `true`).

### `EnvValidationError`

Extended Error class with additional properties:

- **`cause`** - The original Zod validation error
- **`missing`** - Array of missing environment variable names

### Type Utilities

```typescript
import type { InferEnv } from '@kastia/env';

const env = createEnv(schema);
type Env = InferEnv<typeof env>; // Infer the env type
```

## Examples

### Basic Web Application

```typescript
import { z } from 'zod/v4-mini';
import { createEnv } from '@kastia/env';

const env = createEnv({
  // Database
  DATABASE_URL: z.string().check(z.url()),
  
  // Server
  PORT: z._default(z.coerce.number().check(z.gte(1), z.lte(65535)), 3000),
  HOST: z._default(z.string(), '0.0.0.0'),
  
  // Environment
  NODE_ENV: z._default(z.enum(['development', 'production', 'test']), 'development'),
  
  // Security
  JWT_SECRET: z.string().check(z.minLength(32)),
  CORS_ORIGIN: z._default(z.string(), '*'),
  
  // Optional features
  REDIS_URL: z.optional(z.string().check(z.url())),
  SENTRY_DSN: z.optional(z.string().check(z.url())),
});

export { env };
```

### Microservice Configuration

```typescript
const env = createEnv({
  SERVICE_NAME: z.string(),
  SERVICE_VERSION: z._default(z.string(), '1.0.0'),
  
  // Observability
  OTEL_EXPORTER_OTLP_ENDPOINT: z.optional(z.string().check(z.url())),
  LOG_LEVEL: z._default(z.enum(['debug', 'info', 'warn', 'error']), 'info'),
  
  // External services
  AUTH_SERVICE_URL: z.string().check(z.url()),
  USER_SERVICE_URL: z.string().check(z.url()),
  
  // Resources
  MAX_MEMORY_MB: z._default(z.coerce.number().check(z.gte(128)), 512),
  MAX_CONNECTIONS: z._default(z.coerce.number().check(z.gte(1)), 100),
});
```

## Platform Support

- ✅ **Node.js** - Native support with `process.env`
- ✅ **Deno** - Use `Deno.env.toObject()` as envSource
- ✅ **Bun** - Native support with `process.env`
- ✅ **Cloudflare Workers** - Use `env` bindings as envSource
- ✅ **Vercel Edge** - Use `process.env` or custom sources
- ✅ **Vite/Rollup** - Use `import.meta.env` as envSource

## Why @kastia/env?

- **Zero-config** - Works out of the box with sensible defaults
- **Developer Experience** - Clear error messages and TypeScript integration
- **Performance** - Minimal runtime overhead, built on Zod v4-mini
- **Flexibility** - Supports any environment source and runtime
- **Safety** - Immutable results prevent accidental modifications

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Emblaze](https://github.com/em-blaze)
