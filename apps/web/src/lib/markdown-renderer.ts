/**
 * Markdown Renderer with Syntax Highlighting
 *
 * Uses marked for parsing and basic code formatting
 */

import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Configure marked renderer with basic code styling
 */
marked.setOptions({
  breaks: true,
  gfm: true,
});

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Custom renderer for code blocks
const renderer = new marked.Renderer();

renderer.code = function (code: { text: string; lang?: string; escaped?: boolean }) {
  const validLanguage = code.lang || 'text';
  const escapedLanguage = escapeHtml(validLanguage);
  const escapedCode = code.escaped ? code.text : escapeHtml(code.text);

  // Create styled code block with language label
  return `
    <div class="relative group my-4">
      <div class="flex items-center justify-between px-4 py-2 bg-muted/50 rounded-t-lg border-b border-border">
        <span class="text-xs font-mono text-muted-foreground">${escapedLanguage}</span>
      </div>
      <pre class="overflow-x-auto p-4 rounded-b-lg bg-muted/30"><code class="language-${escapedLanguage}">${escapedCode}</code></pre>
    </div>
  `;
};

marked.setOptions({ renderer });

/**
 * Render markdown to HTML (synchronous)
 * Note: marked.parse returns Promise in v17+, but we use marked.parse() for backward compat
 */
export function renderMarkdownSync(markdown: string): string {
  if (!markdown) return '';

  try {
    // Use marked.parse() - marked v17 returns Promise but we handle it synchronously
    // For better performance, we use lexer and parser directly
    const tokens = marked.lexer(markdown);
    const html = marked.parser(tokens);
    // Sanitize HTML to prevent XSS
    return DOMPurify.sanitize(html);
  } catch (error) {
    console.error('Markdown parsing error:', error);
    return `<p>${escapeHtml(markdown)}</p>`;
  }
}
