import { db } from '@sambung-chat/db';
import { chats, folders } from '@sambung-chat/db/schema/chat';
import { messages } from '@sambung-chat/db/schema/chat';
import { models } from '@sambung-chat/db/schema/model';
import { eq, and, desc, asc, sql, gte, lte, inArray, ilike } from 'drizzle-orm';
import z from 'zod';
import { protectedProcedure, withCsrfProtection } from '../index';
import { ulidSchema, ulidOptionalSchema } from '../utils/validation';

export const chatRouter = {
  // Get all chats for current user
  getAll: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;
    return await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt));
  }),

  // Get all chats with messages and folder information for export
  getAllChatsWithMessages: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    // Get all chats for the user
    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt));

    // Guard against empty chatIds to prevent invalid SQL
    const chatIds = userChats.map((chat) => chat.id);
    if (chatIds.length === 0) {
      // No chats, return empty array with empty messages structure
      return userChats.map((chat) => ({
        ...chat,
        messages: [],
        folder: null,
      }));
    }

    // Batch-fetch all messages for all chats (avoid N+1)
    const allMessages = await db
      .select()
      .from(messages)
      .where(inArray(messages.chatId, chatIds))
      .orderBy(asc(messages.createdAt));

    // Group messages by chatId for efficient lookup
    const messagesByChatId = new Map<string, typeof allMessages>();
    for (const message of allMessages) {
      if (!messagesByChatId.has(message.chatId)) {
        messagesByChatId.set(message.chatId, []);
      }
      messagesByChatId.get(message.chatId)!.push(message);
    }

    // Batch-fetch all folders for chats that have folderId (avoid N+1)
    const folderIds = userChats
      .map((chat) => chat.folderId)
      .filter((id): id is string => id !== null);
    const foldersMap = new Map<string, { id: string; name: string }>();
    if (folderIds.length > 0) {
      const uniqueFolderIds = [...new Set(folderIds)];
      const folderResults = await db
        .select()
        .from(folders)
        .where(and(inArray(folders.id, uniqueFolderIds), eq(folders.userId, userId)));

      for (const folder of folderResults) {
        foldersMap.set(folder.id, { id: folder.id, name: folder.name });
      }
    }

    // Combine data
    const chatsWithDetails = userChats.map((chat) => ({
      ...chat,
      messages: messagesByChatId.get(chat.id) || [],
      folder: chat.folderId ? foldersMap.get(chat.folderId) || null : null,
    }));

    return chatsWithDetails;
  }),

  // Get chats grouped by folders for structured export
  getChatsByFolder: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    // Get all chats for the user
    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt));

    // Guard against empty chatIds to prevent invalid SQL
    const chatIds = userChats.map((chat) => chat.id);
    if (chatIds.length === 0) {
      // No chats, return empty structure
      return {
        folders: [],
        uncategorized: [],
      };
    }

    // Batch-fetch all messages for all chats (avoid N+1)
    const allMessages = await db
      .select()
      .from(messages)
      .where(inArray(messages.chatId, chatIds))
      .orderBy(asc(messages.createdAt));

    // Group messages by chatId for efficient lookup
    const messagesByChatId = new Map<string, typeof allMessages>();
    for (const message of allMessages) {
      if (!messagesByChatId.has(message.chatId)) {
        messagesByChatId.set(message.chatId, []);
      }
      messagesByChatId.get(message.chatId)!.push(message);
    }

    // Batch-fetch all folders for chats that have folderId (avoid N+1)
    const folderIds = userChats
      .map((chat) => chat.folderId)
      .filter((id): id is string => id !== null);
    const foldersMap = new Map<string, { id: string; name: string }>();
    if (folderIds.length > 0) {
      const uniqueFolderIds = [...new Set(folderIds)];
      const folderResults = await db
        .select()
        .from(folders)
        .where(and(inArray(folders.id, uniqueFolderIds), eq(folders.userId, userId)));

      for (const folder of folderResults) {
        foldersMap.set(folder.id, { id: folder.id, name: folder.name });
      }
    }

    // Combine data
    const chatsWithDetails = userChats.map((chat) => ({
      ...chat,
      messages: messagesByChatId.get(chat.id) || [],
      folder: chat.folderId ? foldersMap.get(chat.folderId) || null : null,
    }));

    // Group chats by folder
    const folderMap = new Map<
      string,
      { id: string; name: string; chats: typeof chatsWithDetails }
    >();
    const uncategorizedChats: typeof chatsWithDetails = [];

    for (const chat of chatsWithDetails) {
      if (chat.folder) {
        // Chat has a folder
        const folderId = chat.folder.id;
        if (!folderMap.has(folderId)) {
          folderMap.set(folderId, {
            id: chat.folder.id,
            name: chat.folder.name,
            chats: [],
          });
        }
        folderMap.get(folderId)!.chats.push(chat);
      } else {
        // Chat has no folder
        uncategorizedChats.push(chat);
      }
    }

    // Convert map to array and sort by folder name
    const foldersArray = Array.from(folderMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return {
      folders: foldersArray,
      uncategorized: uncategorizedChats,
    };
  }),

  // Get chat by ID with messages
  getById: protectedProcedure
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Get chat
      const chatResults = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, input.id), eq(chats.userId, userId)));

      if (chatResults.length === 0) {
        return null;
      }

      const chat = chatResults[0];

      // Get messages for this chat
      const chatMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, input.id))
        .orderBy(asc(messages.createdAt));

      return {
        ...chat,
        messages: chatMessages,
      };
    }),

  // Create new chat
  create: protectedProcedure
    .use(withCsrfProtection)
    .input(
      z.object({
        title: z.string().min(1).default('New Chat'),
        modelId: z.string().min(1),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const [chat] = await db
        .insert(chats)
        .values({
          userId,
          title: input.title,
          modelId: input.modelId,
        })
        .returning();

      return chat;
    }),

  // Update chat
  update: protectedProcedure
    .use(withCsrfProtection)
    .input(
      z.object({
        id: ulidSchema,
        title: z.string().min(1).optional(),
        modelId: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const { id, ...data } = input;

      const results = await db
        .update(chats)
        .set(data)
        .where(and(eq(chats.id, id), eq(chats.userId, userId)))
        .returning();

      return results[0];
    }),

  // Delete chat
  delete: protectedProcedure
    .use(withCsrfProtection)
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      await db.delete(chats).where(and(eq(chats.id, input.id), eq(chats.userId, userId)));

      return { success: true };
    }),

  // Toggle pin status
  togglePin: protectedProcedure
    .use(withCsrfProtection)
    .input(z.object({ id: ulidSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Get current pin status
      const chatResults = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, input.id), eq(chats.userId, userId)));

      if (chatResults.length === 0) {
        throw new Error('Chat not found');
      }

      const currentPinStatus = chatResults[0]?.pinned || false;

      // Toggle pin
      const results = await db
        .update(chats)
        .set({ pinned: !currentPinStatus })
        .where(and(eq(chats.id, input.id), eq(chats.userId, userId)))
        .returning();

      if (results.length === 0) {
        throw new Error('Failed to update chat');
      }

      return { ...results[0], pinned: !currentPinStatus };
    }),

  // Update chat folder
  updateFolder: protectedProcedure
    .use(withCsrfProtection)
    .input(z.object({ id: ulidSchema, folderId: ulidOptionalSchema }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const results = await db
        .update(chats)
        .set({ folderId: input.folderId })
        .where(and(eq(chats.id, input.id), eq(chats.userId, userId)))
        .returning();

      return results[0];
    }),

  // Search chats
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        folderId: ulidOptionalSchema,
        pinnedOnly: z.boolean().optional(),
        providers: z
          .array(z.enum(['openai', 'anthropic', 'google', 'groq', 'ollama', 'custom']))
          .optional(),
        modelIds: z.array(z.string()).optional(),
        dateFrom: z.coerce.date().optional(),
        dateTo: z.coerce.date().optional(),
        searchInMessages: z.boolean().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Normalize query: trim whitespace to prevent searching for empty/whitespace-only strings
      const normalizedQuery = input.query?.trim();

      const conditions = [eq(chats.userId, userId)];

      // Build search conditions for title and/or message content
      if (normalizedQuery) {
        if (input.searchInMessages) {
          // Search in both title and message content
          conditions.push(
            sql`(${chats.title} ILIKE ${`%${normalizedQuery}%`} OR ${messages.content} ILIKE ${`%${normalizedQuery}%`})`
          );
        } else {
          // Search only in title
          conditions.push(sql`${chats.title} ILIKE ${`%${normalizedQuery}%`}`);
        }
      }

      if (input.folderId !== undefined) {
        if (input.folderId === null) {
          conditions.push(sql`${chats.folderId} IS NULL`);
        } else {
          conditions.push(eq(chats.folderId, input.folderId));
        }
      }

      if (input.pinnedOnly) {
        conditions.push(eq(chats.pinned, true));
      }

      // Add date range filter (input.dateFrom/dateTo are already Date objects from Zod coercion)
      if (input.dateFrom) {
        conditions.push(gte(chats.createdAt, input.dateFrom));
      }

      if (input.dateTo) {
        conditions.push(lte(chats.createdAt, input.dateTo));
      }

      // Build the query - join with models and/or messages tables as needed
      const needsModelJoin = input.providers !== undefined || input.modelIds !== undefined;
      const needsMessagesJoin = Boolean(input.searchInMessages && normalizedQuery);

      let query;
      if (needsModelJoin && needsMessagesJoin) {
        // Add providers filter (multi-select)
        if (Array.isArray(input.providers) && input.providers.length > 0) {
          conditions.push(inArray(models.provider, input.providers));
        }

        // Add modelIds filter (multi-select)
        if (Array.isArray(input.modelIds) && input.modelIds.length > 0) {
          conditions.push(inArray(models.id, input.modelIds));
        }

        // Join with both models and messages tables
        // Use DISTINCT ON to avoid duplicate chats when multiple messages match
        query = db
          .selectDistinct({
            id: chats.id,
            userId: chats.userId,
            title: chats.title,
            modelId: chats.modelId,
            folderId: chats.folderId,
            pinned: chats.pinned,
            createdAt: chats.createdAt,
            updatedAt: chats.updatedAt,
          })
          .from(chats)
          .innerJoin(models, eq(chats.modelId, models.id))
          .innerJoin(messages, eq(chats.id, messages.chatId))
          .where(and(...conditions))
          .orderBy(desc(chats.pinned), desc(chats.updatedAt));
      } else if (needsModelJoin) {
        // Add providers filter (multi-select)
        if (Array.isArray(input.providers) && input.providers.length > 0) {
          conditions.push(inArray(models.provider, input.providers));
        }

        // Add modelIds filter (multi-select)
        if (Array.isArray(input.modelIds) && input.modelIds.length > 0) {
          conditions.push(inArray(models.id, input.modelIds));
        }

        query = db
          .select({
            id: chats.id,
            userId: chats.userId,
            title: chats.title,
            modelId: chats.modelId,
            folderId: chats.folderId,
            pinned: chats.pinned,
            createdAt: chats.createdAt,
            updatedAt: chats.updatedAt,
          })
          .from(chats)
          .innerJoin(models, eq(chats.modelId, models.id))
          .where(and(...conditions))
          .orderBy(desc(chats.pinned), desc(chats.updatedAt));
      } else if (needsMessagesJoin) {
        // Join only with messages table
        // Use DISTINCT ON to avoid duplicate chats when multiple messages match
        query = db
          .selectDistinct({
            id: chats.id,
            userId: chats.userId,
            title: chats.title,
            modelId: chats.modelId,
            folderId: chats.folderId,
            pinned: chats.pinned,
            createdAt: chats.createdAt,
            updatedAt: chats.updatedAt,
          })
          .from(chats)
          .innerJoin(messages, eq(chats.id, messages.chatId))
          .where(and(...conditions))
          .orderBy(desc(chats.pinned), desc(chats.updatedAt));
      } else {
        // No joins needed
        query = db
          .select()
          .from(chats)
          .where(and(...conditions))
          .orderBy(desc(chats.pinned), desc(chats.updatedAt));
      }

      const results = await query;

      // If searching in messages and a query was provided, fetch matching message snippets
      let resultsWithSnippets = results;
      if (input.searchInMessages && normalizedQuery && results.length > 0) {
        const chatIds = results.map((r) => r.id);

        // Get all matching messages for these chats
        const matchingMessages = await db
          .select({
            id: messages.id,
            chatId: messages.chatId,
            role: messages.role,
            content: messages.content,
            createdAt: messages.createdAt,
          })
          .from(messages)
          .where(
            and(inArray(messages.chatId, chatIds), ilike(messages.content, `%${normalizedQuery}%`))
          )
          .orderBy(asc(messages.createdAt));

        // Group messages by chatId and limit to top 3 per chat
        const messagesByChat = new Map<string, typeof matchingMessages>();
        for (const msg of matchingMessages) {
          if (!messagesByChat.has(msg.chatId)) {
            messagesByChat.set(msg.chatId, []);
          }
          const chatMessages = messagesByChat.get(msg.chatId)!;
          // Limit to 3 matching messages per chat to avoid huge responses
          if (chatMessages.length < 3) {
            chatMessages.push(msg);
          }
        }

        // Attach matching messages to each chat result
        resultsWithSnippets = results.map((chat) => ({
          ...chat,
          matchingMessages: messagesByChat.get(chat.id) || [],
        }));
      }

      return resultsWithSnippets;
    }),
};
