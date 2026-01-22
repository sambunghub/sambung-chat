<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { Card, CardContent, CardHeader } from '$lib/components/ui/card/index.js';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import KeyIcon from '@lucide/svelte/icons/key';
  import ShieldIcon from '@lucide/svelte/icons/shield';
  import ApiKeyCard from './api-key-card.svelte';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';

  /**
   * API Key data structure (same as card)
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
   * Props for the API key list component
   */
  interface Props {
    /** Array of API keys to display */
    apiKeys: ApiKeyData[];
    /** Whether the list is currently loading */
    loading?: boolean;
    /** Record of visible keys (id -> full key) */
    visibleKeys?: Record<string, string>;
    /** Callback when add button is clicked */
    onadd?: () => void;
    /** Callback when edit is clicked for a key */
    onedit?: (id: string) => void;
    /** Callback when delete is clicked for a key */
    ondelete?: (id: string) => void;
    /** Callback when visibility toggle is clicked */
    ontogglevisibility?: (id: string) => void;
    /** Callback when copy is clicked */
    oncopy?: (text: string) => void;
  }

  let {
    apiKeys,
    loading = false,
    visibleKeys = {},
    onadd,
    onedit,
    ondelete,
    ontogglevisibility,
    oncopy,
  }: Props = $props();

  // Ensure apiKeys is always an array and filter out undefined items
  const safeApiKeys = $derived((apiKeys || []).filter((key) => key !== undefined && key !== null));
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-foreground text-lg font-semibold">Your API Keys</h3>
      <p class="text-muted-foreground text-sm">Add and manage your encrypted API keys</p>
    </div>
    {#if onadd}
      <Button onclick={onadd}>
        <PlusIcon class="mr-2 size-4" />
        Add API Key
      </Button>
    {/if}
  </div>

  {#if loading}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each Array(3) as _, i (i)}
        <Card>
          <CardHeader class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Skeleton class="size-8 rounded-full" />
                <Skeleton class="h-5 w-32" />
              </div>
              <Skeleton class="size-8" />
            </div>
            <Skeleton class="h-4 w-24" />
          </CardHeader>
          <CardContent class="space-y-2">
            <Skeleton class="h-8 w-full" />
            <Skeleton class="h-4 w-48" />
          </CardContent>
        </Card>
      {/each}
    </div>
  {:else if safeApiKeys.length === 0}
    <Card>
      <CardContent class="py-12">
        <div class="text-center">
          <ShieldIcon class="text-muted-foreground mx-auto mb-4 size-12 opacity-50" />
          <h4 class="text-foreground mb-2 text-lg font-semibold">No API keys configured</h4>
          <p class="text-muted-foreground mb-4 text-sm">
            Add your first API key to start using AI models
          </p>
          {#if onadd}
            <Button onclick={onadd} variant="outline">
              <KeyIcon class="mr-2 size-4" />
              Add Your First API Key
            </Button>
          {/if}
        </div>
      </CardContent>
    </Card>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each safeApiKeys as apiKey (apiKey.id)}
        <ApiKeyCard
          {apiKey}
          showKey={!!visibleKeys[apiKey.id]}
          fullKey={visibleKeys[apiKey.id]}
          {onedit}
          {ondelete}
          {ontogglevisibility}
          {oncopy}
        />
      {/each}
    </div>
  {/if}
</div>
