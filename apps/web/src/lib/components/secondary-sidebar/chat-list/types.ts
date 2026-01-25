/**
 * Shared type definitions for ChatList components
 *
 * This file centralizes all type definitions used across the ChatList component hierarchy,
 * including domain types (re-exported from chat-grouping utility) and component Props interfaces.
 *
 * @module chat-list/types
 */

// Import domain types from chat-grouping utility (re-exported below)
import type {
  MatchingMessage,
  Chat,
  Folder,
  FolderGroup,
  GroupedChats,
} from './utils/chat-grouping.js';

// Re-export domain types for external use
export type { MatchingMessage, Chat, Folder, FolderGroup, GroupedChats };

/**
 * Callback type definitions for chat operations
 */

/** Select a chat and navigate to it */
export type SelectChatCallback = (chatId: string) => void;

/** Delete a chat by ID */
export type DeleteChatCallback = (chatId: string) => void;

/** Rename a chat by ID with new title */
export type RenameChatCallback = (chatId: string, newTitle: string) => void;

/** Toggle pin status of a chat */
export type TogglePinCallback = (chatId: string) => void;

/** Move a chat to a folder (null to remove from folder) */
export type MoveToFolderCallback = (chatId: string, folderId: string | null) => void;

/** Create a new folder from a chat */
export type CreateFolderCallback = (chatId: string) => void;

/**
 * Callback type definitions for folder operations
 */

/** Toggle collapse/expand state of a folder */
export type ToggleFolderCallback = (folderId: string) => void;

/** Start inline rename for a folder */
export type StartFolderRenameCallback = (folderId: string, folderName: string) => void;

/** Save folder rename changes */
export type SaveFolderRenameCallback = () => void;

/** Cancel folder rename operation */
export type CancelFolderRenameCallback = () => void;

/** Delete a folder by ID */
export type DeleteFolderCallback = (folderId: string, folderName: string) => void;

/** Handle keyboard events in folder input */
export type FolderKeydownCallback = (e: KeyboardEvent) => void;

/** Handle folder rename value changes */
export type FolderRenameValueChangeCallback = (value: string) => void;

/**
 * Callback type definitions for filter operations
 */

/** Handle search query changes */
export type SearchChangeCallback = (query: string) => void;

/** Handle search keyboard events */
export type SearchKeydownCallback = (e: KeyboardEvent) => void;

/** Handle folder selection changes */
export type FolderChangeCallback = (folderId: string) => void;

/** Handle pinned filter toggle changes */
export type PinnedChangeCallback = (checked: boolean) => void;

/** Open advanced filters dialog */
export type OpenAdvancedFiltersCallback = () => void;

/**
 * Callback type definitions for header operations
 */

/** Create a new chat */
export type CreateNewChatCallback = () => void;

/** Export all chats in specified format */
export type ExportAllCallback = (format: 'json' | 'md' | 'zip') => void;

/** Retry failed operation */
export type RetryCallback = () => void;

/**
 * Component Props Interfaces
 */

/**
 * Props for ChatListHeader component
 */
export interface ChatListHeaderProps {
  /** Title to display in header */
  title: string;

  /** Whether export operation is in progress */
  exporting: boolean;

  /** Callback to create a new chat */
  onCreateNewChat: CreateNewChatCallback;

  /** Callback to export all chats */
  onExportAll: ExportAllCallback;
}

/**
 * Props for ChatListFilters component
 */
export interface ChatListFiltersProps {
  /** Current search query */
  searchQuery: string;

  /** Available folders to filter by */
  folders: Folder[];

  /** Currently selected folder ID */
  selectedFolderId: string;

  /** Whether to show only pinned chats */
  showPinnedOnly: boolean;

  /** Whether advanced filters are active */
  hasActiveFilters: boolean;

  /** Callback when search query changes */
  onSearchChange: SearchChangeCallback;

  /** Callback when search key is pressed */
  onSearchKeydown: SearchKeydownCallback;

  /** Callback when folder selection changes */
  onFolderChange: FolderChangeCallback;

  /** Callback when pinned filter changes */
  onPinnedChange: PinnedChangeCallback;

  /** Callback to open advanced filters dialog */
  onOpenAdvancedFilters: OpenAdvancedFiltersCallback;
}

/**
 * Props for PinnedChatsSection component
 */
export interface PinnedChatsSectionProps {
  /** Array of pinned chats to display */
  pinnedChats: Chat[];

  /** ID of currently active chat */
  currentChatId: string | undefined;

  /** Current search query for highlighting */
  searchQuery: string;

  /** Available folders for move-to-folder operation */
  folders: Folder[];

  /** Callback when a chat is selected */
  onSelectChat: SelectChatCallback;

  /** Callback when a chat is deleted */
  onDeleteChat: DeleteChatCallback;

  /** Callback when a chat is renamed */
  onRenameChat: RenameChatCallback;

  /** Callback when a chat pin is toggled */
  onTogglePin: TogglePinCallback;

  /** Callback when a chat is moved to a folder */
  onMoveToFolder: MoveToFolderCallback;

  /** Callback when a new folder is created from a chat */
  onCreateFolder: CreateFolderCallback;
}

/**
 * Props for NoFolderChatsSection component
 */
export interface NoFolderChatsSectionProps {
  /** Array of chats without folders to display */
  noFolderChats: Chat[];

  /** ID of currently active chat */
  currentChatId: string | undefined;

  /** Current search query for highlighting */
  searchQuery: string;

  /** Available folders for move-to-folder operation */
  folders: Folder[];

  /** Callback when a chat is selected */
  onSelectChat: SelectChatCallback;

  /** Callback when a chat is deleted */
  onDeleteChat: DeleteChatCallback;

  /** Callback when a chat is renamed */
  onRenameChat: RenameChatCallback;

  /** Callback when a chat pin is toggled */
  onTogglePin: TogglePinCallback;

  /** Callback when a chat is moved to a folder */
  onMoveToFolder: MoveToFolderCallback;

  /** Callback when a new folder is created from a chat */
  onCreateFolder: CreateFolderCallback;
}

/**
 * Props for FolderChatsSection component
 */
export interface FolderChatsSectionProps {
  /** Array of folder groups with their chats */
  folderGroups: FolderGroup[];

  /** ID of currently active chat */
  currentChatId: string | undefined;

  /** Current search query for highlighting */
  searchQuery: string;

  /** Available folders for move-to-folder operation */
  folders: Folder[];

  /** Record of collapsed folder IDs */
  collapsedFolders: Record<string, boolean>;

  /** ID of folder being renamed (null if none) */
  renamingFolderId: string | null;

  /** Current value of folder rename input */
  folderRenameValue: string;

  /** Callback when a chat is selected */
  onSelectChat: SelectChatCallback;

  /** Callback when a chat is deleted */
  onDeleteChat: DeleteChatCallback;

  /** Callback when a chat is renamed */
  onRenameChat: RenameChatCallback;

  /** Callback when a chat pin is toggled */
  onTogglePin: TogglePinCallback;

  /** Callback when a chat is moved to a folder */
  onMoveToFolder: MoveToFolderCallback;

  /** Callback when a new folder is created from a chat */
  onCreateFolder: CreateFolderCallback;

  /** Callback when folder collapse is toggled */
  onToggleFolder: ToggleFolderCallback;

  /** Callback when folder rename starts */
  onStartFolderRename: StartFolderRenameCallback;

  /** Callback when folder rename is saved */
  onSaveFolderRename: SaveFolderRenameCallback;

  /** Callback when folder rename is cancelled */
  onCancelFolderRename: CancelFolderRenameCallback;

  /** Callback when folder is deleted */
  onDeleteFolder: DeleteFolderCallback;

  /** Callback for folder input keyboard events */
  onFolderKeydown: FolderKeydownCallback;

  /** Callback when folder rename value changes */
  onFolderRenameValueChange: FolderRenameValueChangeCallback;
}

/**
 * Props for FolderItem component
 */
export interface FolderItemProps {
  /** Folder to display */
  folder: Folder;

  /** Chats in this folder */
  folderChats: Chat[];

  /** Whether folder is collapsed */
  isCollapsed: boolean;

  /** Whether folder is being renamed */
  isRenaming: boolean;

  /** Current rename input value */
  renameValue: string;

  /** ID of currently active chat */
  currentChatId: string | undefined;

  /** Current search query for highlighting */
  searchQuery: string;

  /** Available folders for move-to-folder operation */
  folders: Folder[];

  /** Callback to toggle folder collapse */
  onToggle: () => void;

  /** Callback to start folder rename */
  onStartRename: () => void;

  /** Callback to save folder rename */
  onSaveRename: () => void;

  /** Callback to cancel folder rename */
  onCancelRename: () => void;

  /** Callback to delete folder */
  onDelete: () => void;

  /** Callback for folder input keyboard events */
  onFolderKeydown: FolderKeydownCallback;

  /** Callback when folder rename value changes */
  onFolderRenameValueChange: FolderRenameValueChangeCallback;

  /** Callback when a chat is selected */
  onSelectChat: SelectChatCallback;

  /** Callback when a chat is deleted */
  onDeleteChat: DeleteChatCallback;

  /** Callback when a chat is renamed */
  onRenameChat: RenameChatCallback;

  /** Callback when a chat pin is toggled */
  onTogglePin: TogglePinCallback;

  /** Callback when a chat is moved to a folder */
  onMoveToFolder: MoveToFolderCallback;

  /** Callback when a new folder is created from a chat */
  onCreateFolder: CreateFolderCallback;
}

/**
 * Props for ChatListLoadingState component
 */
export interface ChatListLoadingStateProps {
  /** Whether initial data is loading */
  loading: boolean;

  /** Whether search operation is in progress */
  searching: boolean;
}

/**
 * Props for ChatListErrorState component
 */
export interface ChatListErrorStateProps {
  /** Error message to display (null if no error) */
  error: string | null;

  /** Callback to retry failed operation */
  onRetry: RetryCallback;
}
