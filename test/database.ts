/**
 * Test Database Utilities
 *
 * Utilities for setting up, tearing down, and managing test database
 */

import { db } from '@sambung-chat/db';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { chats, messages, prompts, apiKeys, user } from '@sambung-chat/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Setup test database
 * - Runs migrations
 * - Ensures clean state
 */
export async function setupTestDB() {
  try {
    // Run migrations
    await migrate(db, { migrationsFolder: 'packages/db/drizzle' });
    console.log('✅ Test database migrations completed');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
}

/**
 * Teardown test database
 * - Deletes all test data
 */
export async function teardownTestDB() {
  try {
    // Delete in correct order due to foreign key constraints
    await db.delete(messages);
    await db.delete(chats);
    await db.delete(prompts);
    await db.delete(apiKeys);
    await db.delete(user);
    console.log('✅ Test database cleanup completed');
  } catch (error) {
    console.error('❌ Test database teardown failed:', error);
    throw error;
  }
}

/**
 * Create a test user
 */
export async function createTestUser(userData: { email: string; name: string; password?: string }) {
  // In real tests, use bcrypt to hash password
  const passwordHash = userData.password || 'hashed_password';

  const [newUser] = await db
    .insert(user)
    .values({
      email: userData.email,
      name: userData.name,
      passwordHash,
    })
    .returning();

  return newUser;
}

/**
 * Create a test chat
 */
export async function createTestChat(userId: string, overrides = {}) {
  const [chat] = await db
    .insert(chats)
    .values({
      userId,
      title: 'Test Chat',
      modelId: 'gpt-4',
      ...overrides,
    })
    .returning();

  return chat;
}

/**
 * Create test messages for a chat
 */
export async function createTestMessages(
  chatId: number,
  messagesData: Array<{ role: 'user' | 'assistant'; content: string }>
) {
  const createdMessages = await db
    .insert(messages)
    .values(
      messagesData.map((msg) => ({
        chatId,
        ...msg,
      }))
    )
    .returning();

  return createdMessages;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const users = await db.select().from(user).where(eq(user.email, email));
  return users[0];
}

/**
 * Get chat by ID
 */
export async function getChatById(chatId: number) {
  const chatsResult = await db.select().from(chats).where(eq(chats.id, chatId));
  return chatsResult[0];
}

/**
 * Get messages for chat
 */
export async function getMessagesByChatId(chatId: number) {
  return await db.select().from(messages).where(eq(messages.chatId, chatId));
}

/**
 * Truncate all tables (for faster cleanup in tests)
 */
export async function truncateAllTables() {
  await db.delete(messages);
  await db.delete(chats);
  await db.delete(prompts);
  await db.delete(apiKeys);
  await db.delete(user);
}
