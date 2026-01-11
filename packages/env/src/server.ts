import 'dotenv/config';
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    OPENAI_API_KEY: z.string().min(1),
    OPENAI_BASE_URL: z.string().url().default('https://api.z.ai/api/coding/paas/v4'),
    OPENAI_MODEL: z.string().default('glm-4.7'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
