<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import CheckIcon from '@lucide/svelte/icons/check';
  import { cn } from '$lib/utils';

  interface Props {
    code: string;
    language?: string;
    class?: string;
  }

  let { code, language = 'text', class: className = '' }: Props = $props();

  let highlightedCode = $state('');
  let copied = $state(false);
  let copyTimeout: ReturnType<typeof setTimeout> | null = null;

  // Detect language from code block if not provided
  const detectedLanguage = $derived(() => {
    if (language && language !== 'text') {
      return language;
    }

    // Simple detection based on common patterns
    const patterns = [
      { lang: 'javascript', regex: /\b(const|let|var|function|=>|import|export|async|await)\b/ },
      { lang: 'typescript', regex: /\b(interface|type|enum|implements|:)\b/ },
      { lang: 'python', regex: /\b(def|class|import|from|print|__\w+__)\b/ },
      { lang: 'html', regex: /<\/?[a-z][\s\S]*>/i },
      { lang: 'css', regex: /\.[a-z][\w-]*\s*{/i },
      { lang: 'json', regex: /^\s*{[\s\S]*}\s*$/ },
      { lang: 'bash', regex: /^\s*(#!\/|bash|echo|cd|ls|mkdir|rm|git)\s/ },
      { lang: 'sql', regex: /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|DROP|TABLE)\b/i },
    ];

    for (const { lang, regex } of patterns) {
      if (regex.test(code.split('\n')[0])) {
        return lang;
      }
    }

    return 'text';
  });

  // Simple syntax highlighting (basic implementation)
  // TODO: Integrate Shiki for full syntax highlighting
  function highlightCode(code: string, lang: string): string {
    // Escape HTML first
    let escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Basic syntax highlighting patterns
    const patterns = [
      // Strings
      { pattern: /(".*?"|'.*?'|`.*?`)/g, class: 'text-green-500 dark:text-green-400' },
      // Comments
      { pattern: /(\/\/.*$|#.*$|\/\*[\s\S]*?\*\/)/gm, class: 'text-gray-500 italic' },
      // Keywords
      {
        pattern:
          /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|typeof|instanceof)\b/g,
        class: 'text-purple-600 dark:text-purple-400 font-semibold',
      },
      // Numbers
      { pattern: /\b(\d+\.?\d*)\b/g, class: 'text-orange-600 dark:text-orange-400' },
      // Functions
      { pattern: /\b([a-zA-Z_]\w*)\s*\(/g, class: 'text-blue-600 dark:text-blue-400' },
    ];

    // Apply highlighting (simple version, won't handle all edge cases)
    patterns.forEach(({ pattern, class: className }) => {
      escaped = escaped.replace(pattern, (match) => {
        return `<span class="${className}">${match}</span>`;
      });
    });

    return escaped;
  }

  onMount(() => {
    if (browser) {
      highlightedCode = highlightCode(code, detectedLanguage());
    }
  });

  async function copyCode() {
    if (!browser) return;

    try {
      await navigator.clipboard.writeText(code);
      copied = true;

      // Clear previous timeout if exists
      if (copyTimeout) {
        clearTimeout(copyTimeout);
      }

      // Reset copied state after 2 seconds
      copyTimeout = setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  }
</script>

<div class={cn('code-block-wrapper group my-4', className)}>
  <!-- Header with language badge and copy button -->
  <div
    class="code-header flex items-center justify-between rounded-t-lg border border-[#2d2d2d] bg-[#2d2d2d] px-4 py-2"
  >
    <span class="language-badge text-muted-foreground text-xs font-medium tracking-wide uppercase">
      {detectedLanguage()}
    </span>
    <button
      onclick={copyCode}
      class="copy-button bg-primary/10 hover:bg-primary/20 text-foreground flex items-center gap-1 rounded px-2 py-1 text-xs transition-all duration-200"
      title="Copy code"
      aria-label="Copy code to clipboard"
    >
      {#if copied}
        <CheckIcon class="size-3.5 text-green-500" />
        <span class="text-green-500">Copied!</span>
      {:else}
        <CopyIcon class="size-3.5" />
        <span>Copy</span>
      {/if}
    </button>
  </div>

  <!-- Code content -->
  <pre
    class="code-content max-h-[400px] overflow-x-auto overflow-y-auto rounded-b-lg border border-t-0 border-[#2d2d2d] bg-[#1e1e1e] p-4 font-mono text-sm leading-relaxed"><code
      >{@html highlightedCode}</code
    ></pre>
</div>

<style>
  /* Custom scrollbar for code blocks */
  .code-content::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .code-content::-webkit-scrollbar-track {
    @apply bg-muted/20;
  }

  .code-content::-webkit-scrollbar-thumb {
    @apply bg-muted-foreground/30 rounded;
  }

  .code-content::-webkit-scrollbar-thumb:hover {
    @apply bg-muted-foreground/50;
  }

  /* Reduce motion support */
  @media (prefers-reduced-motion: reduce) {
    .copy-button {
      transition: none;
    }
  }
</style>
