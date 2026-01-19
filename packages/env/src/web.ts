import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  clientPrefix: 'PUBLIC_',
  client: {
    PUBLIC_SERVER_URL: z.url(),
    PUBLIC_API_URL: z.url(),
    PUBLIC_KEYCLOAK_ENABLED: z
      .enum(['true', 'false'])
      .optional()
      .default('false')
      .transform((val) => val === 'true'),
    PUBLIC_EMAIL_PASSWORD_ENABLED: z
      .enum(['true', 'false'])
      .optional()
      .default('true')
      .transform((val) => val === 'true'),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  runtimeEnv: (import.meta as any).env,
  emptyStringAsUndefined: true,
});
