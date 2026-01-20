<script lang="ts">
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '$lib/components/ui/card/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import EditIcon from '@lucide/svelte/icons/edit';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import EyeOffIcon from '@lucide/svelte/icons/eye-off';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import { providers } from './types.js';

  /**
   * API Key data structure
   */
  export interface ApiKeyData {
    id: string;
    provider: string;
    name: string;
    keyLast4: string;
    isActive: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
  }

  /**
   * Props for the API key card component
   */
  interface Props {
    /** API key data to display */
    apiKey: ApiKeyData;
    /** Whether the full key is currently visible */
    showKey?: boolean;
    /** Callback when edit is clicked */
    onedit?: (id: string) => void;
    /** Callback when delete is clicked */
    ondelete?: (id: string) => void;
    /** Callback when visibility toggle is clicked */
    ontogglevisibility?: (id: string) => void;
    /** Callback when copy is clicked */
    oncopy?: (text: string) => void;
    /** The full API key (only provided when visible) */
    fullKey?: string;
  }

  let {
    apiKey,
    showKey = false,
    onedit,
    ondelete,
    ontogglevisibility,
    oncopy,
    fullKey,
  }: Props = $props();

  /**
   * Get provider label from value
   */
  function getProviderLabel(provider: string): string {
    return providers.find((p) => p.value === provider)?.label || provider;
  }

  /**
   * Get provider color class
   */
  function getProviderColor(provider: string): string {
    const colors: Record<string, string> = {
      openai: 'bg-emerald-500',
      anthropic: 'bg-orange-500',
      google: 'bg-blue-500',
      groq: 'bg-purple-500',
      ollama: 'bg-gray-500',
      openrouter: 'bg-pink-500',
      other: 'bg-slate-500',
    };
    return colors[provider] || 'bg-slate-500';
  }

  /**
   * Format date for display
   */
  function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  }
</script>

<Card class={!apiKey.isActive ? 'opacity-60' : ''}>
  <CardHeader>
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-2">
        <div
          class="flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white {getProviderColor(
            apiKey.provider
          )}"
        >
          {getProviderLabel(apiKey.provider).charAt(0)}
        </div>
        <CardTitle class="text-base">
          {apiKey.name}
        </CardTitle>
      </div>
      {#if onedit || ondelete}
        <DropdownMenu.DropdownMenu>
          <DropdownMenu.DropdownMenuTrigger
            class="hover:bg-accent rounded p-1"
            onclick={(e) => e.stopPropagation()}
          >
            <EditIcon class="size-4" />
          </DropdownMenu.DropdownMenuTrigger>
          <DropdownMenu.DropdownMenuContent>
            {#if onedit}
              <DropdownMenu.DropdownMenuItem onclick={() => onedit?.(apiKey.id)}>
                <EditIcon class="mr-2 size-4" />
                Edit
              </DropdownMenu.DropdownMenuItem>
            {/if}
            {#if ondelete}
              <DropdownMenu.DropdownMenuItem
                onclick={() => ondelete?.(apiKey.id)}
                class="text-destructive focus:text-destructive"
              >
                <Trash2Icon class="mr-2 size-4" />
                Delete
              </DropdownMenu.DropdownMenuItem>
            {/if}
          </DropdownMenu.DropdownMenuContent>
        </DropdownMenu.DropdownMenu>
      {/if}
    </div>
    <CardDescription class="text-xs">
      {getProviderLabel(apiKey.provider)}
      {#if !apiKey.isActive}
        · <span class="text-muted-foreground">Inactive</span>
      {/if}
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div class="space-y-2">
      <div class="flex items-center gap-2">
        <div class="text-muted-foreground text-xs">Key ending in</div>
        <code class="bg-muted text-foreground rounded px-2 py-1 font-mono text-xs">
          ••••{apiKey.keyLast4}
        </code>
        {#if ontogglevisibility}
          <Button
            size="sm"
            variant="ghost"
            class="h-6 w-6 p-0"
            onclick={() => ontogglevisibility?.(apiKey.id)}
          >
            {#if showKey}
              <EyeOffIcon class="size-3" />
            {:else}
              <EyeIcon class="size-3" />
            {/if}
          </Button>
        {/if}
      </div>

      {#if showKey && fullKey && oncopy}
        <div class="space-y-1 text-xs">
          <div class="flex items-center gap-2">
            <code
              class="bg-muted text-foreground flex-1 rounded px-2 py-1 font-mono text-xs break-all"
            >
              {fullKey}
            </code>
            <Button size="sm" variant="ghost" class="h-6 w-6 p-0" onclick={() => oncopy?.(fullKey)}>
              <CopyIcon class="size-3" />
            </Button>
          </div>
        </div>
      {/if}

      <div class="text-muted-foreground text-xs">
        Added {formatDate(apiKey.createdAt)}
      </div>
    </div>
  </CardContent>
</Card>
