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
}

/**
 * Convert chat to JSON format
 */
export function exportToJSON(chat: ChatExport): string {
  return JSON.stringify(chat, null, 2);
}

/**
 * Convert chat to Markdown format
 */
export function exportToMarkdown(chat: ChatExport): string {
  let md = `# ${chat.title}\n\n`;
  md += `**Model:** ${chat.modelId}\n`;
  md += `**Created:** ${new Date(chat.createdAt).toLocaleString()}\n`;
  md += `**Updated:** ${new Date(chat.updatedAt).toLocaleString()}\n\n`;
  md += `---\n\n`;

  for (const message of chat.messages) {
    const role = message.role === 'user' ? '👤 **User**' : '🤖 **Assistant**';
    md += `## ${role}\n\n`;
    md += `${message.content}\n\n`;

    if (message.metadata?.model) {
      md += `*Model: ${message.metadata.model}`;
      if (message.metadata.tokens) {
        md += ` | Tokens: ${message.metadata.tokens}`;
      }
      md += '*\n\n';
    }
  }

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
