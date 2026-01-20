import JSZip from 'jszip';

// Types for chat export
// IMPORTANT: All IDs use ULID strings (26 chars), not integers
// See docs/ULID-STANDARD.md for more information
export interface ChatMessage {
  id: string; // ULID
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    model?: string;
    tokens?: number;
    finishReason?: string;
  };
  createdAt: Date;
}

export interface ChatExport {
  id: string; // ULID
  title: string;
  modelId: string;
  pinned: boolean;
  folderId: string | null; // ULID
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
  folder?: {
    id: string;
    name: string;
  };
}

export interface ChatFolder {
  id: string;
  name: string;
  chats: ChatExport[];
}

export interface ChatsByFolder {
  folders: ChatFolder[];
  uncategorized: ChatExport[];
}

/**
 * Convert chat to JSON format
 */
export function exportToJSON(chat: ChatExport): string {
  return JSON.stringify(chat, null, 2);
}

/**
 * Format date to human-readable format
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Convert chat to Markdown format with enhanced formatting
 */
export function exportToMarkdown(chat: ChatExport): string {
  let md = `# ${chat.title}\n\n`;

  // Enhanced header metadata with blockquote
  md += `> **📅 Created:** ${formatDate(chat.createdAt)}  \n`;
  md += `> **🔄 Updated:** ${formatDate(chat.updatedAt)}  \n`;
  md += `> **🤖 Model:** ${chat.modelId}  \n`;
  md += `> **💬 Messages:** ${chat.messages.length}  \n`;

  if (chat.pinned) {
    md += `> **📌 Pinned:** Yes  \n`;
  }

  if (chat.folder) {
    md += `> **📁 Folder:** ${chat.folder.name}  \n`;
  }

  md += `\n---\n\n`;

  // Process each message
  chat.messages.forEach((message, index) => {
    // Determine role icon and label
    let roleIcon: string;
    let roleName: string;
    if (message.role === 'user') {
      roleIcon = '👤';
      roleName = 'User';
    } else if (message.role === 'system') {
      roleIcon = '⚙️';
      roleName = 'System';
    } else {
      roleIcon = '🤖';
      roleName = 'Assistant';
    }

    // Message header with timestamp
    md += `## ${roleIcon} ${roleName}\n\n`;
    md += `**⏰ Time:** ${formatDate(message.createdAt)}\n\n`;

    // Message content
    md += `${message.content}\n\n`;

    // Enhanced metadata section
    if (message.metadata && Object.keys(message.metadata).length > 0) {
      md += `***\n\n`;
      md += `**📋 Metadata:**\n\n`;

      if (message.metadata.model) {
        md += `- **Model:** \`${message.metadata.model}\`\n`;
      }

      if (message.metadata.tokens) {
        md += `- **Tokens:** ${message.metadata.tokens}\n`;
      }

      if (message.metadata.finishReason) {
        md += `- **Finish Reason:** ${message.metadata.finishReason}\n`;
      }

      md += `\n`;
    }

    // Clear separator between messages (not after the last one)
    if (index < chat.messages.length - 1) {
      md += `---\n\n`;
    }
  });

  return md;
}

/**
 * Convert chat to plain text format
 */
export function exportToText(chat: ChatExport): string {
  let text = `${chat.title}\n`;
  text += `${'='.repeat(chat.title.length)}\n\n`;
  text += `Model: ${chat.modelId}\n`;
  text += `Created: ${new Date(chat.createdAt).toLocaleString()}\n`;
  text += `Updated: ${new Date(chat.updatedAt).toLocaleString()}\n\n`;
  text += `${'-'.repeat(40)}\n\n`;

  for (const message of chat.messages) {
    const role = message.role === 'user' ? 'USER' : 'ASSISTANT';
    text += `[${role}]\n`;
    text += `${message.content}\n\n`;

    if (message.metadata?.model) {
      text += `(Model: ${message.metadata.model}`;
      if (message.metadata.tokens) {
        text += `, Tokens: ${message.metadata.tokens}`;
      }
      text += `)\n\n`;
    }
  }

  return text;
}

/**
 * Download content as file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export chat and download as file
 */
export function exportChat(chat: ChatExport, format: 'json' | 'md' | 'txt', chatId?: string): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const safeTitle = chat.title
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .slice(0, 50);
  const filename = `chat_${chatId || chat.id}_${safeTitle}_${timestamp}`;

  let content: string;
  let mimeType: string;

  switch (format) {
    case 'json':
      content = exportToJSON(chat);
      mimeType = 'application/json';
      break;
    case 'md':
      content = exportToMarkdown(chat);
      mimeType = 'text/markdown';
      break;
    case 'txt':
      content = exportToText(chat);
      mimeType = 'text/plain';
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }

  downloadFile(content, `${filename}.${format}`, mimeType);
}

/**
 * Export multiple chats as a single JSON file
 */
export function exportMultipleChats(chats: ChatExport[], filename?: string): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFilename = `sambung_chats_export_${timestamp}.json`;
  const finalFilename = filename || defaultFilename;

  const content = JSON.stringify(chats, null, 2);
  downloadFile(content, finalFilename, 'application/json');
}

/**
 * Sanitize filename for ZIP compatibility
 * Removes or replaces characters that are problematic in filenames
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid filename characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .slice(0, 100); // Limit length to 100 characters
}

/**
 * Sanitize folder name for ZIP compatibility
 * Similar to sanitizeFilename but preserves some structure
 */
function sanitizeFolderName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);
}

/**
 * Generate filename for a chat export
 */
function generateChatFilename(chat: ChatExport, format: 'json' | 'md'): string {
  const safeTitle = sanitizeFilename(chat.title);
  const timestamp = new Date(chat.createdAt).toISOString().split('T')[0];
  return `${safeTitle}_${timestamp}.${format}`;
}

/**
 * Export chats as ZIP file with folder structure preserved
 * @param chatsByFolder Chats organized by folders
 * @param format Export format ('json' or 'md')
 * @param filename Optional custom filename for the ZIP
 */
export async function exportChatsAsZIP(
  chatsByFolder: ChatsByFolder,
  format: 'json' | 'md',
  filename?: string
): Promise<void> {
  const zip = new JSZip();
  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFilename = `sambung_chats_export_${timestamp}.zip`;
  const finalFilename = filename || defaultFilename;

  // Add chats in folders
  for (const folder of chatsByFolder.folders) {
    const folderName = sanitizeFolderName(folder.name);

    for (const chat of folder.chats) {
      const chatFilename = generateChatFilename(chat, format);
      const folderPath = `${folderName}/${chatFilename}`;

      let content: string;
      if (format === 'json') {
        content = exportToJSON(chat);
      } else {
        content = exportToMarkdown(chat);
      }

      zip.file(folderPath, content);
    }
  }

  // Add uncategorized chats at root level
  for (const chat of chatsByFolder.uncategorized) {
    const chatFilename = generateChatFilename(chat, format);
    let content: string;

    if (format === 'json') {
      content = exportToJSON(chat);
    } else {
      content = exportToMarkdown(chat);
    }

    zip.file(chatFilename, content);
  }

  // Generate ZIP file and trigger download
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export all chats as ZIP with both JSON and Markdown formats
 * Creates a ZIP with subfolders for each format
 * @param chatsByFolder Chats organized by folders
 * @param filename Optional custom filename for the ZIP
 */
export async function exportChatsAsZIPOptimized(
  chatsByFolder: ChatsByFolder,
  filename?: string
): Promise<void> {
  const zip = new JSZip();
  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFilename = `sambung_chats_export_${timestamp}.zip`;
  const finalFilename = filename || defaultFilename;

  // Create folders for each format
  const jsonFolder = zip.folder('json');
  const markdownFolder = zip.folder('markdown');

  if (!jsonFolder || !markdownFolder) {
    throw new Error('Failed to create ZIP folders');
  }

  // Add chats in folders
  for (const folder of chatsByFolder.folders) {
    const folderName = sanitizeFolderName(folder.name);

    // Create subfolders in each format folder
    const jsonSubfolder = jsonFolder.folder(folderName);
    const markdownSubfolder = markdownFolder.folder(folderName);

    if (!jsonSubfolder || !markdownSubfolder) continue;

    for (const chat of folder.chats) {
      const chatFilename = generateChatFilename(chat, 'json');
      const mdFilename = generateChatFilename(chat, 'md');

      jsonSubfolder.file(chatFilename, exportToJSON(chat));
      markdownSubfolder.file(mdFilename, exportToMarkdown(chat));
    }
  }

  // Add uncategorized chats at root level
  for (const chat of chatsByFolder.uncategorized) {
    const chatFilename = generateChatFilename(chat, 'json');
    const mdFilename = generateChatFilename(chat, 'md');

    jsonFolder.file(chatFilename, exportToJSON(chat));
    markdownFolder.file(mdFilename, exportToMarkdown(chat));
  }

  // Generate ZIP file and trigger download
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
