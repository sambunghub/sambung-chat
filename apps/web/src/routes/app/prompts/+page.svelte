<script lang="ts">
  import { Separator } from '$lib/components/ui/separator/index.js';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
  import SecondarySidebarTrigger from '$lib/components/secondary-sidebar-trigger.svelte';
  import PromptLibrary from '$lib/components/prompt-library.svelte';
  import {
    prompts,
    loading,
    submitting,
    selectedCategory,
    loadPrompts,
    loadCounts,
  } from '$lib/stores/prompts.js';
  import { orpc } from '$lib/orpc';
  import { toast } from 'svelte-sonner';
  import { onMount } from 'svelte';

  // Load initial data - counts are already loaded by PromptsCategories
  onMount(async () => {
    await loadPrompts();
  });

  // Event handlers
  async function handleCreate(data: {
    name: string;
    content: string;
    variables: string[];
    category: string;
    isPublic: boolean;
  }) {
    try {
      submitting.set(true);
      await orpc.prompt.create({
        ...data,
        category: data.category as
          | 'general'
          | 'coding'
          | 'writing'
          | 'analysis'
          | 'creative'
          | 'business'
          | 'custom',
      });
      await loadCounts();
      await loadPrompts();
      toast.success('Prompt created successfully');
    } catch (error) {
      console.error('Failed to create prompt:', error);
      toast.error('Failed to create prompt');
    } finally {
      submitting.set(false);
    }
  }

  async function handleUpdate(
    id: string,
    data: {
      name: string;
      content: string;
      variables: string[];
      category: string | null;
      isPublic: boolean;
    }
  ) {
    try {
      submitting.set(true);
      // Convert null to undefined for API (optional fields)
      const { category, ...rest } = data;
      await orpc.prompt.update({
        id,
        ...rest,
        ...(category !== null && {
          category: category as
            | 'general'
            | 'coding'
            | 'writing'
            | 'analysis'
            | 'creative'
            | 'business'
            | 'custom',
        }),
      });
      await loadCounts();
      await loadPrompts();
      toast.success('Prompt updated successfully');
    } catch (error) {
      console.error('Failed to update prompt:', error);
      toast.error('Failed to update prompt');
    } finally {
      submitting.set(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      submitting.set(true);
      await orpc.prompt.delete({ id });
      await loadCounts();
      await loadPrompts();
      toast.success('Prompt deleted successfully');
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      toast.error('Failed to delete prompt');
    } finally {
      submitting.set(false);
    }
  }

  async function handleCopy(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Prompt content copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  }

  async function handleDuplicateFromMarketplace(publicPromptId: string) {
    try {
      submitting.set(true);
      const duplicated = await orpc.prompt.duplicateFromPublic({
        publicPromptId,
      });

      if (duplicated) {
        toast.success('Prompt duplicated to your library!');
        // Switch to my-prompts to see the duplicated prompt
        selectedCategory.set('my-prompts');
        await loadCounts();
        await loadPrompts();
      }
    } catch (error) {
      console.error('Failed to duplicate prompt:', error);
      toast.error('Failed to duplicate prompt');
    } finally {
      submitting.set(false);
    }
  }
</script>

<div class="flex flex-1 flex-col overflow-hidden">
  <header class="bg-background sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b p-4">
    <SecondarySidebarTrigger class="-ms-1" />
    <Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
    <h1 class="sr-only">Prompts Library</h1>
    <Breadcrumb.Root>
      <Breadcrumb.List>
        <Breadcrumb.Item>
          <Breadcrumb.Page>Prompts Library</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb.List>
    </Breadcrumb.Root>
  </header>

  <main class="flex-1 overflow-y-auto p-6">
    <PromptLibrary
      prompts={$prompts}
      loading={$loading}
      submitting={$submitting}
      view={$selectedCategory}
      oncreate={handleCreate}
      onupdate={handleUpdate}
      ondelete={handleDelete}
      oncopy={handleCopy}
      onduplicate={handleDuplicateFromMarketplace}
    />
  </main>
</div>
