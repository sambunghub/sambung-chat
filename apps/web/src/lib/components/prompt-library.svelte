<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { Card, CardContent, CardHeader } from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import SearchIcon from '@lucide/svelte/icons/search';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { categories, type PromptFormData } from './prompt-library-form-types.js';
  import PromptForm from './prompt-library-form.svelte';
  import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator
  } from '$lib/components/ui/dropdown-menu/index.js';
  import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import EditIcon from '@lucide/svelte/icons/edit';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import TrashIcon from '@lucide/svelte/icons/trash-2';
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
  } from '$lib/components/ui/dialog/index.js';

  /**
   * Prompt data structure (matches database schema)
   */
  export interface PromptData {
    id: string;
    name: string;
    content: string;
    variables: string[];
    category: string;
    isPublic: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
  }

  /**
   * Props for the PromptLibrary component
   */
  interface Props {
    /** Array of prompts to display */
    prompts: PromptData[];
    /** Whether the list is currently loading */
    loading?: boolean;
    /** Callback when add button is clicked */
    onadd?: () => void;
    /** Callback when create is submitted */
    oncreate?: (data: {
      name: string;
      content: string;
      variables: string[];
      category: string;
      isPublic: boolean;
    }) => void | Promise<void>;
    /** Callback when edit is clicked for a prompt */
    onedit?: (id: string) => void;
    /** Callback when update is submitted */
    onupdate?: (
      id: string,
      data: {
        name: string;
        content: string;
        variables: string[];
        category: string;
        isPublic: boolean;
      }
    ) => void | Promise<void>;
    /** Callback when delete is clicked for a prompt */
    ondelete?: (id: string) => void;
    /** Callback when view is clicked */
    onview?: (id: string) => void;
    /** Callback when copy is clicked */
    oncopy?: (content: string) => void;
    /** Whether create/update is in progress */
    submitting?: boolean;
  }

  let {
    prompts,
    loading = false,
    onadd,
    oncreate,
    onedit,
    onupdate,
    ondelete,
    onview,
    oncopy,
    submitting = false,
  }: Props = $props();

  // Search and filter state
  let searchQuery = $state('');
  let selectedCategory = $state<string>('all');

  // Form dialog state
  let showCreateDialog = $state(false);
  let showEditDialog = $state(false);
  let showViewDialog = $state(false);
  let selectedPrompt = $state<PromptData | null>(null);

  // Form data state
  let formData = $state<PromptFormData>({
    name: '',
    content: '',
    variables: [],
    category: 'general',
    isPublic: false,
  });

  // Filter prompts based on search and category
  let filteredPrompts = $derived(
    prompts.filter((prompt) => {
      const matchesSearch =
        !searchQuery ||
        prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || prompt.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
  );

  // Get unique categories from prompts
  let availableCategories = $derived(() => {
    const categorySet = new Set(prompts.map((p) => p.category));
    return Array.from(categorySet);
  });

  // Open create dialog
  function openCreateDialog() {
    formData = {
      name: '',
      content: '',
      variables: [],
      category: 'general',
      isPublic: false,
    };
    showCreateDialog = true;
  }

  // Open edit dialog
  function openEditDialog(prompt: PromptData) {
    selectedPrompt = prompt;
    formData = {
      name: prompt.name,
      content: prompt.content,
      variables: prompt.variables,
      category: prompt.category as PromptFormData['category'],
      isPublic: prompt.isPublic,
    };
    showEditDialog = true;
  }

  // Open view dialog
  function openViewDialog(prompt: PromptData) {
    selectedPrompt = prompt;
    showViewDialog = true;
  }

  // Handle create
  async function handleCreate() {
    if (!oncreate) return;
    await oncreate(formData);
    showCreateDialog = false;
    formData = {
      name: '',
      content: '',
      variables: [],
      category: 'general',
      isPublic: false,
    };
  }

  // Handle update
  async function handleUpdate() {
    if (!onupdate || !selectedPrompt) return;
    await onupdate(selectedPrompt.id, formData);
    showEditDialog = false;
    selectedPrompt = null;
  }

  // Handle delete
  function handleDelete(id: string) {
    if (ondelete && confirm('Are you sure you want to delete this prompt?')) {
      ondelete(id);
    }
  }

  // Handle copy
  function handleCopy(content: string) {
    if (oncopy) {
      oncopy(content);
    } else {
      navigator.clipboard.writeText(content);
    }
  }

  // Get category badge color
  function getCategoryBadgeColor(category: string): string {
    const colors: Record<string, string> = {
      coding: 'bg-primary/10 text-primary hover:bg-primary/20',
      writing: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
      creative: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      analysis: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
      business: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
      general: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
      custom: 'bg-pink-500/10 text-pink-500 hover:bg-pink-500/20',
    };
    return colors[category] || colors.general;
  }

  // Truncate content
  function truncateContent(content: string, maxLength = 150): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  // Format date
  function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  }
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-foreground text-lg font-semibold">Prompt Library</h3>
      <p class="text-muted-foreground text-sm">Manage and reuse your prompt templates</p>
    </div>
    <Button onclick={onadd || openCreateDialog}>
      <PlusIcon class="mr-2 size-4" />
      New Prompt
    </Button>
  </div>

  <!-- Search and Filters -->
  <div class="flex flex-col gap-4 md:flex-row md:items-center">
    <div class="relative flex-1">
      <SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        bind:value={searchQuery}
        placeholder="Search prompts by name or content..."
        class="pl-9"
      />
    </div>
    <div class="flex items-center gap-2">
      <Label for="category-filter">Category:</Label>
      <select
        id="category-filter"
        bind:value={selectedCategory}
        class="border-input bg-background focus:ring-ring flex h-9 rounded-md border px-3 py-1 text-sm focus:ring-1 focus:outline-none"
      >
        <option value="all">All Categories</option>
        {#each categories as category}
          <option value={category.value}>{category.label}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each Array(3) as _, i (i)}
        <Card>
          <CardHeader class="space-y-2">
            <div class="flex items-center justify-between">
              <Skeleton class="h-5 w-32" />
              <Skeleton class="size-8" />
            </div>
            <Skeleton class="h-4 w-24" />
          </CardHeader>
          <CardContent class="space-y-2">
            <Skeleton class="h-20 w-full" />
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-48" />
          </CardContent>
        </Card>
      {/each}
    </div>

  <!-- Empty State -->
  {:else if prompts.length === 0}
    <Card>
      <CardContent class="py-12">
        <div class="text-center">
          <FileTextIcon class="text-muted-foreground mx-auto mb-4 size-12 opacity-50" />
          <h4 class="text-foreground mb-2 text-lg font-semibold">No prompts yet</h4>
          <p class="text-muted-foreground mb-4 text-sm">
            Create your first prompt template to get started
          </p>
          <Button onclick={onadd || openCreateDialog} variant="outline">
            <PlusIcon class="mr-2 size-4" />
            Create Your First Prompt
          </Button>
        </div>
      </CardContent>
    </Card>

  <!-- No Results State -->
  {:else if filteredPrompts.length === 0}
    <Card>
      <CardContent class="py-12">
        <div class="text-center">
          <SearchIcon class="text-muted-foreground mx-auto mb-4 size-12 opacity-50" />
          <h4 class="text-foreground mb-2 text-lg font-semibold">No prompts found</h4>
          <p class="text-muted-foreground text-sm">
            Try adjusting your search or filter criteria
          </p>
        </div>
      </CardContent>
    </Card>

  <!-- Prompt Grid -->
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each filteredPrompts as prompt (prompt.id)}
        <Card class="group relative">
          <CardHeader class="space-y-2">
            <div class="flex items-start justify-between">
              <div class="flex flex-col gap-1">
                <h4 class="text-foreground text-base font-semibold leading-tight">
                  {prompt.name}
                </h4>
                <div class="flex items-center gap-2">
                  <span class={getCategoryBadgeColor(prompt.category) + ' rounded px-2 py-0.5 text-xs font-medium'}>
                    {categories.find((c) => c.value === prompt.category)?.label || prompt.category}
                  </span>
                  {#if prompt.isPublic}
                    <span class="border-border rounded border px-2 py-0.5 text-xs font-medium">Public</span>
                  {/if}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  class="hover:bg-muted data-[state=open]:bg-muted flex size-8 items-center justify-center rounded-md"
                  type="button"
                >
                  <MoreVerticalIcon class="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onclick={() => openViewDialog(prompt)}>
                    <EyeIcon class="mr-2 size-4" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onclick={() => openEditDialog(prompt)}>
                    <EditIcon class="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onclick={() => handleCopy(prompt.content)}>
                    <CopyIcon class="mr-2 size-4" />
                    Copy Content
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onclick={() => handleDelete(prompt.id)}
                    class="text-destructive focus:text-destructive"
                  >
                    <TrashIcon class="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="bg-muted/50 rounded-md border p-3">
              <p class="text-muted-foreground line-clamp-3 text-sm whitespace-pre-wrap">
                {truncateContent(prompt.content)}
              </p>
            </div>

            {#if prompt.variables.length > 0}
              <div class="flex flex-wrap gap-1">
                {#each prompt.variables.slice(0, 3) as variable}
                  <code class="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
                    {'{' + variable + '}'}
                  </code>
                {/each}
                {#if prompt.variables.length > 3}
                  <code class="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
                    +{prompt.variables.length - 3} more
                  </code>
                {/if}
              </div>
            {/if}

            <p class="text-muted-foreground text-xs">
              Updated {formatDate(prompt.updatedAt)}
            </p>
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<!-- Create Dialog -->
<Dialog bind:open={showCreateDialog}>
  <DialogContent class="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Create New Prompt</DialogTitle>
    </DialogHeader>
    <PromptForm
      bind:data={formData}
      {submitting}
      onsubmit={handleCreate}
      oncancel={() => (showCreateDialog = false)}
    />
  </DialogContent>
</Dialog>

<!-- Edit Dialog -->
<Dialog bind:open={showEditDialog}>
  <DialogContent class="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Edit Prompt</DialogTitle>
    </DialogHeader>
    <PromptForm
      bind:data={formData}
      isEdit={true}
      {submitting}
      onsubmit={handleUpdate}
      oncancel={() => (showEditDialog = false)}
    />
  </DialogContent>
</Dialog>

<!-- View Dialog -->
<Dialog bind:open={showViewDialog}>
  <DialogContent class="max-w-2xl">
    <DialogHeader>
      <DialogTitle>{selectedPrompt?.name}</DialogTitle>
    </DialogHeader>
    {#if selectedPrompt}
      {@const category = selectedPrompt.category}
      {@const isPublic = selectedPrompt.isPublic}
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <span class={getCategoryBadgeColor(category) + ' rounded px-2 py-0.5 text-xs font-medium'}>
            {categories.find((c) => c.value === category)?.label || category}
          </span>
          {#if isPublic}
            <span class="border-border rounded border px-2 py-0.5 text-xs font-medium">Public</span>
          {/if}
        </div>

        <div class="bg-muted/50 rounded-md border p-4">
          <p class="text-foreground whitespace-pre-wrap text-sm">{selectedPrompt.content}</p>
        </div>

        {#if selectedPrompt.variables.length > 0}
          <div>
            <p class="text-muted-foreground mb-2 text-sm font-medium">Variables:</p>
            <div class="flex flex-wrap gap-2">
              {#each selectedPrompt.variables as variable}
                <code class="bg-muted rounded px-2 py-1 text-sm">{`{${variable}}`}</code>
              {/each}
            </div>
          </div>
        {/if}

        <div class="text-muted-foreground text-xs">
          Created: {formatDate(selectedPrompt.createdAt)} • Updated:
          {formatDate(selectedPrompt.updatedAt)}
        </div>
      </div>
    {/if}
  </DialogContent>
</Dialog>
