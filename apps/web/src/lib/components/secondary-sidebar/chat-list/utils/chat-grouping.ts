/**
 * Chat grouping utility functions
 * Pure functions for organizing chats by folder and pinned status
 */

/**
 * Represents a message match in search results
 */
export interface MatchingMessage {
  id: string;
  chatId: string;
  role: string;
  content: string;
  createdAt: Date;
}

/**
 * Represents a chat in the system
 */
export interface Chat {
  id: string;
  title: string;
  modelId: string;
  pinned: boolean;
  folderId: string | null;
  createdAt: Date;
  updatedAt: Date;
  matchingMessages?: MatchingMessage[];
}

/**
 * Represents a folder in the system
 */
export interface Folder {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
}

/**
 * Represents a folder with its associated chats
 */
export interface FolderGroup {
  folder: Folder;
  chats: Chat[];
}

/**
 * Represents grouped chats organized by pinned status and folder
 */
export interface GroupedChats {
  pinnedChats: Chat[];
  folderGroups: FolderGroup[];
  noFolderChats: Chat[];
}

/**
 * Group chats by folder and pinned status
 *
 * This pure function takes an array of chats and folders and returns
 * a GroupedChats object with three categories:
 * - pinnedChats: All chats with pinned=true (regardless of folder)
 * - folderGroups: Chats organized by their folder (excluding pinned)
 * - noFolderChats: Chats without a folder (excluding pinned)
 *
 * @param chats - Array of chats to group
 * @param folders - Array of folders for grouping
 * @returns GroupedChats object with organized chat arrays
 *
 * @example
 * ```ts
 * const chats = [chat1, chat2, chat3];
 * const folders = [folder1, folder2];
 * const grouped = groupChatsByFolder(chats, folders);
 * // grouped.pinnedChats - all pinned chats
 * // grouped.folderGroups - non-pinned chats by folder
 * // grouped.noFolderChats - non-pinned chats without folder
 * ```
 */
export function groupChatsByFolder(chats: Chat[], folders: Folder[]): GroupedChats {
  const pinnedChats: Chat[] = [];
  const folderGroupsArray: FolderGroup[] = [];
  const noFolderChats: Chat[] = [];

  // Build folder groups array
  if (folders && folders.length > 0) {
    const folderRecord: Record<string, Chat[]> = {};

    // Initialize folder record with all folders
    for (const folder of folders) {
      folderRecord[folder.id] = [];
    }

    // Group chats by folder
    for (const chat of chats) {
      if (chat.pinned) {
        // Pinned chats go to pinned section (regardless of folder)
        pinnedChats.push(chat);
      } else if (chat.folderId && folderRecord[chat.folderId]) {
        // Chat has a valid folder ID
        folderRecord[chat.folderId]!.push(chat);
      } else {
        // Chat has no folder or invalid folder ID
        noFolderChats.push(chat);
      }
    }

    // Convert folder record to array of folder groups
    for (const folder of folders) {
      const chatsInFolder = folderRecord[folder.id] || [];
      folderGroupsArray.push({ folder, chats: chatsInFolder });
    }
  } else {
    // No folders exist - all non-pinned chats go to noFolderChats
    for (const chat of chats) {
      if (chat.pinned) {
        pinnedChats.push(chat);
      } else {
        noFolderChats.push(chat);
      }
    }
  }

  return {
    pinnedChats,
    folderGroups: folderGroupsArray,
    noFolderChats,
  };
}
