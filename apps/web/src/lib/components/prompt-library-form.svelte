<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import CheckIcon from '@lucide/svelte/icons/check';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import XIcon from '@lucide/svelte/icons/x';
  import type { PromptFormData } from './prompt-library-form-types.js';
  import { categories } from './prompt-library-form-types.js';

  // Props for the prompt form component
  interface Props {
    // Form data
    data: PromptFormData;
    // Whether the form is in edit mode
    isEdit?: boolean;
    // Whether the form is currently submitting
    submitting?: boolean;
    // Callback when form is submitted
    onsubmit: (data: PromptFormData) => void | Promise<void>;
    // Callback when form is cancelled
    oncancel?: () => void;
  }

  let { data, isEdit = false, submitting = false, onsubmit, oncancel }: Props = $props();

  // Local form state - initialized from props, then independent
  let formData = $state<PromptFormData>({
    name: data.name,
    content: data.content,
    variables: data.variables || [],
    category: data.category,
    isPublic: data.isPublic,
  });

  // Track previous data to detect external changes only
  let prevDataName = $state(data.name);
  let prevDataContent = $state(data.content);

  // Reset form when data prop changes externally (detected by content/name change)
  $effect(() => {
    // Only reset if name or content actually changed (external update)
    if (data.name !== prevDataName || data.content !== prevDataContent) {
      formData = {
        name: data.name,
        content: data.content,
        variables: data.variables || [],
        category: data.category,
        isPublic: data.isPublic,
      };
      prevDataName = data.name;
      prevDataContent = data.content;
    }
  });

  // Local state for variable input
  let variableInput = $state('');

  // Validate form data
  function validateForm(): boolean {
    return Boolean(formData.name.trim() && formData.content.trim() && formData.category);
  }

  // Add a variable to the list
  function addVariable() {
    const trimmed = variableInput.trim();
    if (trimmed && !formData.variables.includes(trimmed)) {
      formData.variables = [...formData.variables, trimmed];
      variableInput = '';
    }
  }

  // Remove a variable from the list
  function removeVariable(variable: string) {
    formData.variables = formData.variables.filter((v) => v !== variable);
  }

  // Handle Enter key in variable input
  function handleVariableKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addVariable();
    }
  }

  // Handle form submission
  async function handleSubmit() {
    if (!validateForm() || submitting) return;

    // Debug log
    console.log('[FORM] Submitting formData:', formData);

    try {
      await onsubmit(formData);
    } catch (error) {
      // Error is handled by parent component
    }
  }

  // Get category label from value
  function getCategoryLabel(category: string): string {
    return categories.find((c) => c.value === category)?.label || category;
  }
</script>

<div class="space-y-4">
  <div class="space-y-2">
    <Label for={isEdit ? 'edit-name' : 'name'}>Name</Label>
    <Input
      id={isEdit ? 'edit-name' : 'name'}
      bind:value={formData.name}
      placeholder="e.g., Code Review Assistant"
      required
      disabled={submitting}
      class="disabled:cursor-not-allowed disabled:opacity-50"
    />
    <p class="text-muted-foreground text-xs">A friendly name to identify this prompt</p>
  </div>

  <div class="space-y-2">
    <Label for={isEdit ? 'edit-content' : 'content'}>Content</Label>
    <textarea
      id={isEdit ? 'edit-content' : 'content'}
      bind:value={formData.content}
      placeholder={'Enter your prompt template here. Use {variable} syntax for dynamic values.'}
      required
      disabled={submitting}
      rows={8}
      class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full resize-y rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    ></textarea>
    <p class="text-muted-foreground text-xs">
      The main prompt text. Use <code class="bg-muted rounded px-1 py-0.5">{'{variable}'}</code> for placeholders
    </p>
  </div>

  <div class="space-y-2">
    <Label for={isEdit ? 'edit-category' : 'category'}>Category</Label>
    <select
      id={isEdit ? 'edit-category' : 'category'}
      bind:value={formData.category}
      disabled={submitting}
      class="border-input bg-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      {#each categories as category}
        <option value={category.value}>{category.label}</option>
      {/each}
    </select>
  </div>

  <div class="space-y-2">
    <Label for={isEdit ? 'edit-variables' : 'variables'}>Variables</Label>
    <div class="flex gap-2">
      <Input
        id={isEdit ? 'edit-variables' : 'variables'}
        bind:value={variableInput}
        placeholder="e.g., company_name"
        disabled={submitting}
        onkeydown={handleVariableKeydown}
        class="flex-1 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onclick={addVariable}
        disabled={submitting || !variableInput.trim()}
        class="shrink-0"
      >
        <PlusIcon class="size-4" />
      </Button>
    </div>
    <p class="text-muted-foreground text-xs">
      Add variables used in your prompt template. Press Enter or click + to add.
    </p>

    {#if formData.variables.length > 0}
      <div class="mt-2 flex flex-wrap gap-2">
        {#each formData.variables as variable}
          <div class="bg-muted flex items-center gap-1 rounded-md border px-2 py-1 text-sm">
            <code class="font-mono">{`{${variable}}`}</code>
            <button
              type="button"
              onclick={() => removeVariable(variable)}
              disabled={submitting}
              class="hover:text-destructive text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Remove variable"
            >
              <XIcon class="size-3" />
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="flex items-center gap-2">
    <input
      type="checkbox"
      id={isEdit ? 'edit-public' : 'public'}
      bind:checked={formData.isPublic}
      disabled={submitting}
      class="border-input bg-background focus:ring-ring rounded border px-2 py-1 text-sm focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    />
    <Label for={isEdit ? 'edit-public' : 'public'} class="text-sm">Make this prompt public</Label>
  </div>
  <p class="text-muted-foreground text-xs">Public prompts can be seen and used by other users</p>
</div>

<div class="bg-muted/30 flex justify-end gap-2 border-t p-4">
  {#if oncancel}
    <Button variant="outline" onclick={oncancel} disabled={submitting}>Cancel</Button>
  {/if}
  <Button onclick={handleSubmit} disabled={!validateForm() || submitting}>
    <CheckIcon class="mr-2 size-4" />
    {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Prompt'}
  </Button>
</div>
