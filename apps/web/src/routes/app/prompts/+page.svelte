<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
  import SecondarySidebarTrigger from '$lib/components/secondary-sidebar-trigger.svelte';
  import PromptLibrary from '$lib/components/prompt-library.svelte';
  import { onMount } from 'svelte';
  import type { PromptData } from '$lib/components/prompt-library.svelte';
  import { orpc } from '$lib/orpc';
  import { toast } from 'svelte-sonner';

  // State
  let prompts = $state<PromptData[]>([]);
  let loading = $state(true);
  let submitting = $state(false);

  // Load prompts on mount
  onMount(async () => {
    await loadPrompts();
  });

  async function loadPrompts() {
    try {
      loading = true;
      const data = await (orpc as any).prompt.getAll();
      prompts = data.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt)
      }));
    } catch (error) {
      console.error('Failed to load prompts:', error);
      toast.error('Failed to load prompts');
    } finally {
      loading = false;
    }
  }

  // Event handlers
  async function handleCreate(data: {
    name: string;
    content: string;
    variables: string[];
    category: string;
    isPublic: boolean;
  }) {
    try {
      submitting = true;
      await (orpc as any).prompt.create(data);
      await loadPrompts();
      toast.success('Prompt created successfully');
    } catch (error) {
      console.error('Failed to create prompt:', error);
      toast.error('Failed to create prompt');
    } finally {
      submitting = false;
    }
  }

  function openCreateDialog() {
    // Dialog is managed internally by PromptLibrary component
  }

  function handleEdit(id: string) {
    // Dialog is managed internally by PromptLibrary component
  }

  async function handleUpdate(
    id: string,
    data: {
      name: string;
      content: string;
      variables: string[];
      category: string;
      isPublic: boolean;
    }
  ) {
    try {
      submitting = true;
      await (orpc as any).prompt.update({ id, data });
      await loadPrompts();
      toast.success('Prompt updated successfully');
    } catch (error) {
      console.error('Failed to update prompt:', error);
      toast.error('Failed to update prompt');
    } finally {
      submitting = false;
    }
  }

  async function handleDelete(id: string) {
    try {
      submitting = true;
      await (orpc as any).prompt.delete({ id });
      await loadPrompts();
      toast.success('Prompt deleted successfully');
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      toast.error('Failed to delete prompt');
    } finally {
      submitting = false;
    }
  }

  function handleView(id: string) {
    // Dialog is managed internally by PromptLibrary component
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
</script>

<header class="bg-background sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b p-4">
  <SecondarySidebarTrigger class="-ms-1" />
  <Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
  <Breadcrumb.Root>
    <Breadcrumb.List>
      <Breadcrumb.Item>
        <Breadcrumb.Page>Prompts Library</Breadcrumb.Page>
      </Breadcrumb.Item>
    </Breadcrumb.List>
  </Breadcrumb.Root>
</header>

<main class="p-6">
  <PromptLibrary
    {prompts}
    {loading}
    {submitting}
    onadd={openCreateDialog}
    oncreate={handleCreate}
    onedit={handleEdit}
    onupdate={handleUpdate}
    ondelete={handleDelete}
    onview={handleView}
    oncopy={handleCopy}
  />
</main>
