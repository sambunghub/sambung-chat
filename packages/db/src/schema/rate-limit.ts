import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { generateULID } from '../utils/ulid';

/**
 * Rate limit tracking table
 *
 * Stores individual request timestamps for rate limiting.
 * This enables persistent rate limiting across server restarts
 * and supports horizontal scaling in multi-instance deployments.
 *
 * Architecture:
 * - Each rate limit request is stored as a separate record
 * - Queries filter by identifier + time window to count requests
 * - Old records outside the window are automatically cleaned up
 */
export const rateLimits = pgTable(
  'rate_limits',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateULID()),
    identifier: text('identifier').notNull(), // IP address, user ID, or other unique key
    timestamp: timestamp('timestamp').notNull(), // When the request occurred
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('rate_limit_identifier_idx').on(table.identifier),
    index('rate_limit_timestamp_idx').on(table.timestamp),
    // Composite index for efficient window queries
    index('rate_limit_identifier_timestamp_idx').on(table.identifier, table.timestamp),
  ]
);

/**
 * Rate limit relations (none currently - this is a standalone table)
 */
export const rateLimitRelations = relations(rateLimits, ({}) => ({}));
