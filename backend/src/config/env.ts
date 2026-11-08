import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  CORS_ORIGIN: z.string().url('CORS_ORIGIN must be a valid URL'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters (256 bits) for security'),
  JWT_EXPIRES_IN: z.string().default('8h'),
});

export type AppEnv = z.infer<typeof envSchema>;

/**
 * Parses and validates application environment variables at startup.
 * Fails fast with a descriptive error if required configuration is missing or weak.
 *
 * @param rawEnv - Process environment dictionary to validate.
 * @returns Strongly-typed validated environment configuration.
 * @throws Error when environment validation fails.
 */
export function loadEnvConfig(rawEnv: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.safeParse(rawEnv);

  if (!parsed.success) {
    const formattedErrors = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${formattedErrors}`);
  }

  return parsed.data;
}

export const env: AppEnv = loadEnvConfig();

