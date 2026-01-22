import { db } from '@sambung-chat/db';
import { chats, folders } from '@sambung-chat/db/schema/chat';
import { messages } from '@sambung-chat/db/schema/chat';
import { eq, and, desc, asc, inArray } from 'drizzle-orm';
import { protectedProcedure } from '../../index';

export const exportRouter = {
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
};
