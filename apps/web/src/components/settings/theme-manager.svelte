<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import ColorPicker from '$lib/components/settings/color-picker.svelte';
  import { orpc } from '$lib/orpc';
  import { applyTheme, getCurrentTheme, defaultThemes, type Theme } from '$lib/themes';
  import { appearance } from '$lib/stores/appearance.store.js';
  import type { HSLColor, ThemeColors, UpdateThemeData } from '$lib/types/theme.js';
  import { cn } from '$lib/utils.js';
  import { browser } from '$app/environment';
  import {
    Palette,
    PencilIcon,
    Trash2Icon,
    Loader2Icon,
    AlertTriangleIcon,
    CheckIcon,
    SaveIcon,
  } from '@lucide/svelte';

  /**
   * Custom theme interface with display properties
   */
  interface CustomTheme {
    id: string;
    name: string;
    description: string | null;
    colors: ThemeColors;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }

  /**
   * Component props
   */
  interface Props {
    /** Additional CSS classes for the container */
    class?: string;
    /** Callback when theme is updated */
    onThemeUpdated?: (themeId: string) => void;
    /** Callback when theme is deleted */
    onThemeDeleted?: (themeId: string) => void;
  }

  let { class: className, onThemeUpdated, onThemeDeleted }: Props = $props();

  // UI state
  let customThemes = $state<CustomTheme[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Edit dialog state
  let editDialogOpen = $state(false);
  let editingTheme = $state<CustomTheme | null>(null);
  let isUpdating = $state(false);
  let updateErrorMessage = $state<string | null>(null);
  let updateSuccessMessage = $state<string | null>(null);

  // Delete dialog state
  let deleteDialogOpen = $state(false);
  let deletingTheme = $state<CustomTheme | null>(null);
  let isDeleting = $state(false);
  let deleteErrorMessage = $state<string | null>(null);

  // Edit form state
  let editThemeName = $state('');
  let editThemeDescription = $state('');
  let editColors = $state<ThemeColors>({
    primary: '210 100% 50%' as HSLColor,
    secondary: '210 100% 45%' as HSLColor,
    background: '0 0% 100%' as HSLColor,
    foreground: '210 20% 10%' as HSLColor,
    muted: '210 20% 90%' as HSLColor,
    mutedForeground: '210 20% 40%' as HSLColor,
    accent: '210 100% 50%' as HSLColor,
    accentForeground: '0 0% 100%' as HSLColor,
    destructive: '0 100% 50%' as HSLColor,
    destructiveForeground: '0 0% 100%' as HSLColor,
    border: '210 20% 85%' as HSLColor,
    input: '210 20% 85%' as HSLColor,
    ring: '210 100% 50%' as HSLColor,
    radius: '0.5',
  });

  /**
   * Color field configuration
   */
  const COLOR_FIELDS = [
    { key: 'primary' as const, label: 'Primary', description: 'Main brand color' },
    { key: 'secondary' as const, label: 'Secondary', description: 'Subtle accent color' },
    { key: 'background' as const, label: 'Background', description: 'Main background' },
    { key: 'foreground' as const, label: 'Foreground', description: 'Primary text' },
    { key: 'muted' as const, label: 'Muted', description: 'Disabled backgrounds' },
    { key: 'mutedForeground' as const, label: 'Muted Foreground', description: 'Disabled text' },
    { key: 'accent' as const, label: 'Accent', description: 'Highlight color' },
    {
      key: 'accentForeground' as const,
      label: 'Accent Foreground',
      description: 'Text on accents',
    },
    { key: 'destructive' as const, label: 'Destructive', description: 'Danger actions' },
    {
      key: 'destructiveForeground' as const,
      label: 'Destructive Foreground',
      description: 'Text on danger',
    },
    { key: 'border' as const, label: 'Border', description: 'Borders and dividers' },
    { key: 'input' as const, label: 'Input', description: 'Form input borders' },
    { key: 'ring' as const, label: 'Ring', description: 'Focus ring color' },
  ] as const;

  /**
   * Load custom themes from backend
   */
  async function loadCustomThemes() {
    if (!browser) return;

    loading = true;
    error = null;

    try {
      const allThemes = await orpc.theme.getAllThemes();

      // Filter out built-in themes and check active state
      const currentThemeId = appearance.currentSettings.themeId;
      const currentTheme = getCurrentTheme();

      const themes: CustomTheme[] = allThemes
        .filter((theme) => !theme.isBuiltIn)
        .map((theme) => {
          // Convert flat color structure from DB to ThemeColors
          const colors: ThemeColors = {
            primary: theme.primary as HSLColor,
            secondary: theme.secondary as HSLColor,
            background: theme.background as HSLColor,
            foreground: theme.foreground as HSLColor,
            muted: theme.muted as HSLColor,
            mutedForeground: theme.mutedForeground as HSLColor,
            accent: theme.accent as HSLColor,
            accentForeground: theme.accentForeground as HSLColor,
            destructive: theme.destructive as HSLColor,
            destructiveForeground: theme.destructiveForeground as HSLColor,
            border: theme.border as HSLColor,
            input: theme.input as HSLColor,
            ring: theme.ring as HSLColor,
            radius: theme.radius,
          };

          return {
            id: theme.id,
            name: theme.name,
            description: theme.description,
            colors,
            isActive:
              currentThemeId === theme.id || (!currentThemeId && currentTheme?.id === theme.id),
            createdAt:
              theme.createdAt instanceof Date ? theme.createdAt.toISOString() : theme.createdAt,
            updatedAt:
              theme.updatedAt instanceof Date ? theme.updatedAt.toISOString() : theme.updatedAt,
          };
        });

      customThemes = themes;
    } catch (err) {
      error = 'Failed to load custom themes';
      console.error('Error loading custom themes:', err);
    } finally {
      loading = false;
    }
  }

  /**
   * Open edit dialog for a theme
   */
  function openEditDialog(theme: CustomTheme) {
    if (!browser) return;

    editingTheme = theme;
    editThemeName = theme.name;
    editThemeDescription = theme.description || '';
    editColors = { ...theme.colors };
    editDialogOpen = true;
    updateErrorMessage = null;
    updateSuccessMessage = null;
  }

  /**
   * Open delete confirmation dialog
   */
  function openDeleteDialog(theme: CustomTheme) {
    if (!browser) return;

    deletingTheme = theme;
    deleteDialogOpen = true;
    deleteErrorMessage = null;
  }

  /**
   * Handle color change in edit form
   */
  function handleColorChange(key: keyof ThemeColors, value: HSLColor) {
    editColors[key] = value;
    updateErrorMessage = null;
    updateSuccessMessage = null;
  }

  /**
   * Validate edit form
   */
  function validateEditForm(): boolean {
    if (!editThemeName.trim()) {
      updateErrorMessage = 'Please enter a theme name';
      return false;
    }

    if (editThemeName.trim().length < 3) {
      updateErrorMessage = 'Theme name must be at least 3 characters';
      return false;
    }

    if (editThemeName.trim().length > 100) {
      updateErrorMessage = 'Theme name must be less than 100 characters';
      return false;
    }

    if (editThemeDescription && editThemeDescription.length > 500) {
      updateErrorMessage = 'Description must be less than 500 characters';
      return false;
    }

    return true;
  }

  /**
   * Handle theme update
   */
  async function handleUpdateTheme() {
    if (!browser || !editingTheme || isUpdating) return;

    updateErrorMessage = null;
    updateSuccessMessage = null;

    if (!validateEditForm()) {
      return;
    }

    isUpdating = true;

    try {
      const updateData: UpdateThemeData = {
        name: editThemeName.trim(),
        description: editThemeDescription.trim() || undefined,
        colors: editColors,
      };

      // Store editingTheme.id before async operation
      const editingThemeId = editingTheme?.id;
      if (!editingThemeId) return;

      await orpc.theme.updateTheme({
        id: editingThemeId,
        ...updateData,
      });

      updateSuccessMessage = `Theme "${editThemeName}" updated successfully!`;

      // Update the theme in our local state
      const themeIndex = customThemes.findIndex((t) => t.id === editingThemeId);
      if (themeIndex !== -1) {
        customThemes[themeIndex] = {
          ...customThemes[themeIndex],
          name: editThemeName.trim(),
          description: editThemeDescription.trim() || null,
          colors: { ...editColors },
          updatedAt: new Date().toISOString(),
        };
      }

      // If this is the active theme, re-apply it
      if (editingTheme.isActive) {
        const updatedTheme: Theme = {
          id: editingTheme.id,
          userId: null, // Not needed for applyTheme
          name: editThemeName.trim(),
          description: editThemeDescription.trim() || null,
          isBuiltIn: false,
          colors: { ...editColors },
          createdAt: editingTheme.createdAt,
          updatedAt: new Date().toISOString(),
        };
        applyTheme(updatedTheme);
      }

      // Close dialog after success
      setTimeout(() => {
        const themeId = editingTheme?.id;
        editDialogOpen = false;
        editingTheme = null;
        updateSuccessMessage = null;

        // Notify parent component
        if (onThemeUpdated && themeId) {
          onThemeUpdated(themeId);
        }
      }, 1500);
    } catch (error) {
      console.error('Failed to update theme:', error);
      updateErrorMessage =
        error instanceof Error ? error.message : 'Failed to update theme. Please try again.';
    } finally {
      isUpdating = false;
    }
  }

  /**
   * Handle theme deletion
   */
  async function handleDeleteTheme() {
    if (!browser || !deletingTheme || isDeleting) return;

    deleteErrorMessage = null;
    isDeleting = true;

    // Store theme data before deletion
    const themeToDelete = deletingTheme;

    try {
      await orpc.theme.deleteTheme({
        id: themeToDelete.id,
      });

      // Remove from local state
      customThemes = customThemes.filter((t) => t.id !== themeToDelete.id);

      // If deleted theme was active, reset to light theme
      if (themeToDelete.isActive) {
        const lightTheme = defaultThemes.find((t) => t.name === 'Light');
        if (lightTheme) {
          applyTheme(lightTheme);
          appearance.updateSetting('themeId', lightTheme.id);
        }
      }

      // Close dialog
      deleteDialogOpen = false;
      deletingTheme = null;

      // Notify parent component
      if (onThemeDeleted) {
        onThemeDeleted(themeToDelete.id);
      }
    } catch (error) {
      console.error('Failed to delete theme:', error);
      deleteErrorMessage =
        error instanceof Error ? error.message : 'Failed to delete theme. Please try again.';
    } finally {
      isDeleting = false;
    }
  }

  /**
   * Check if edit form is valid
   */
  const isEditFormValid = $derived(
    editThemeName.trim().length >= 3 &&
      editThemeName.trim().length <= 100 &&
      (!editThemeDescription || editThemeDescription.length <= 500)
  );

  /**
   * Get CSS color for preview
   */
  function getCssColor(hsl: HSLColor): string {
    const [h, s, l] = hsl.split(' ');
    return `hsl(${h}, ${s}, ${l})`;
  }

  // Load themes on mount
  onMount(() => {
    loadCustomThemes();
  });
</script>

<Card class={cn('overflow-hidden', className)}>
  <CardHeader class="space-y-1 pb-4">
    <div class="flex items-center gap-2">
      <Palette class="text-muted-foreground size-5" />
      <CardTitle class="text-lg">Custom Themes</CardTitle>
    </div>
    <CardDescription>
      Manage your custom themes - edit colors or delete themes you no longer need
    </CardDescription>
  </CardHeader>

  <CardContent class="space-y-4">
    {#if loading}
      <!-- Loading state -->
      <div class="flex min-h-[200px] items-center justify-center">
        <div class="text-muted-foreground text-sm">Loading custom themes...</div>
      </div>
    {:else if error}
      <!-- Error state -->
      <div
        class="border-destructive/50 bg-destructive/10 flex items-center gap-2 rounded-lg border p-4"
      >
        <p class="text-destructive text-sm">{error}</p>
      </div>
    {:else if customThemes.length === 0}
      <!-- Empty state -->
      <div class="border-border bg-muted/30 rounded-lg border p-8 text-center">
        <Palette class="text-muted-foreground mx-auto mb-3 size-8" />
        <p class="text-muted-foreground text-sm font-medium">No custom themes yet</p>
        <p class="text-muted-foreground mt-1 text-xs">
          Create your first custom theme to see it here
        </p>
      </div>
    {:else}
      <!-- Custom themes list -->
      <div class="space-y-3">
        {#each customThemes as theme}
          <div
            class="border-input hover:border-primary/50 relative overflow-hidden rounded-lg border p-4 transition-colors"
            class:ring-2={theme.isActive}
            class:ring-primary={theme.isActive}
          >
            <!-- Active indicator -->
            {#if theme.isActive}
              <div class="border-primary bg-primary/10 border-b px-2 py-1">
                <div class="flex items-center gap-1.5">
                  <CheckIcon class="text-primary size-3" />
                  <span class="text-primary text-xs font-semibold uppercase"> Active Theme </span>
                </div>
              </div>
            {/if}

            <!-- Theme content -->
            <div class="flex items-start gap-4">
              <!-- Color preview swatches -->
              <div class="flex items-center gap-1.5">
                <div
                  class="rounded-md border-2 border-white/20"
                  style="background-color: {getCssColor(theme.colors.primary)}"
                  title="Primary"
                >
                  <div class="size-8"></div>
                </div>
                <div
                  class="rounded-md border-2 border-white/20"
                  style="background-color: {getCssColor(theme.colors.background)}"
                  title="Background"
                >
                  <div class="size-8"></div>
                </div>
                <div
                  class="rounded-md border-2 border-white/20"
                  style="background-color: {getCssColor(theme.colors.foreground)}"
                  title="Foreground"
                >
                  <div class="size-8"></div>
                </div>
                <div
                  class="rounded-md border-2 border-white/20"
                  style="background-color: {getCssColor(theme.colors.accent)}"
                  title="Accent"
                >
                  <div class="size-8"></div>
                </div>
              </div>

              <!-- Theme info -->
              <div class="flex-1 space-y-1">
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold">{theme.name}</h3>
                </div>
                {#if theme.description}
                  <p class="text-muted-foreground line-clamp-2 text-sm">
                    {theme.description}
                  </p>
                {/if}
                <p class="text-muted-foreground text-xs">
                  Last updated: {new Date(theme.updatedAt).toLocaleDateString()}
                </p>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => openEditDialog(theme)}
                  disabled={!browser}
                  aria-label="Edit theme"
                >
                  <PencilIcon class="mr-1.5 size-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => openDeleteDialog(theme)}
                  disabled={!browser}
                  class="hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                  aria-label="Delete theme"
                >
                  <Trash2Icon class="mr-1.5 size-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Summary -->
      <div class="border-border bg-muted/30 rounded-lg border p-3">
        <p class="text-muted-foreground text-xs">
          {customThemes.length} custom theme{customThemes.length !== 1 ? 's' : ''} saved
        </p>
      </div>
    {/if}
  </CardContent>
</Card>

<!-- Edit Dialog -->
<Dialog.Root bind:open={editDialogOpen}>
  <Dialog.Content
    onInteractOutside={(e) => {
      if (isUpdating) e.preventDefault();
    }}
    class="max-h-[90vh] max-w-3xl overflow-y-auto"
  >
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <PencilIcon class="text-primary size-5" />
        Edit Custom Theme
      </Dialog.Title>
      <Dialog.Description>
        Update your theme's name, description, or colors. Changes will be applied immediately if
        this is your active theme.
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-6 py-4">
      <!-- Theme Metadata -->
      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="edit-theme-name" class="text-sm font-medium">
            Theme Name <span class="text-destructive">*</span>
          </Label>
          <Input
            id="edit-theme-name"
            bind:value={editThemeName}
            placeholder="My Custom Theme"
            disabled={isUpdating}
            aria-required="true"
          />
        </div>

        <div class="space-y-2">
          <Label for="edit-theme-description" class="text-sm font-medium">
            Description <span class="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="edit-theme-description"
            bind:value={editThemeDescription}
            placeholder="A brief description of your theme"
            disabled={isUpdating}
          />
        </div>
      </div>

      <!-- Color Pickers -->
      <div class="space-y-4">
        <Label class="text-base font-semibold">Theme Colors</Label>
        <div class="grid gap-6 md:grid-cols-2">
          {#each COLOR_FIELDS as field}
            <ColorPicker
              value={editColors[field.key]}
              label={field.label}
              description={field.description}
              onChange={(value) => handleColorChange(field.key, value)}
              disabled={isUpdating}
              showValues={false}
            />
          {/each}
        </div>
      </div>

      <!-- Messages -->
      {#if updateErrorMessage}
        <div class="destructive bg-destructive/10 text-destructive rounded-md border p-3">
          <p class="text-sm font-medium">{updateErrorMessage}</p>
        </div>
      {/if}

      {#if updateSuccessMessage}
        <div class="border-border bg-muted/30 text-foreground rounded-md border p-3">
          <p class="text-sm font-medium">{updateSuccessMessage}</p>
        </div>
      {/if}
    </div>

    <Dialog.Footer class="gap-2 sm:gap-0">
      <Button
        variant="outline"
        onclick={() => {
          if (!isUpdating) editDialogOpen = false;
        }}
        disabled={isUpdating}
        class="flex-1 sm:flex-none"
      >
        Cancel
      </Button>
      <Button
        variant="default"
        onclick={handleUpdateTheme}
        disabled={!isEditFormValid || isUpdating}
        class="flex-1 sm:flex-none"
      >
        {#if isUpdating}
          <Loader2Icon class="mr-2 size-4 animate-spin" />
          Updating...
        {:else}
          <SaveIcon class="mr-2 size-4" />
          Save Changes
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
  <Dialog.Content onInteractOutside={(e) => e.preventDefault()} class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <AlertTriangleIcon class="text-destructive size-5" />
        Delete Theme?
      </Dialog.Title>
      <Dialog.Description>
        This action cannot be undone. The theme will be permanently removed from your collection.
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 py-4">
      {#if deletingTheme}
        <div class="border-border bg-muted/50 rounded-md border p-3">
          <p class="text-muted-foreground mb-1 text-xs font-medium uppercase">Theme to delete</p>
          <p class="text-foreground font-semibold">{deletingTheme.name}</p>
          {#if deletingTheme.description}
            <p class="text-muted-foreground mt-1 text-sm">
              {deletingTheme.description}
            </p>
          {/if}
        </div>

        {#if deletingTheme.isActive}
          <div
            class="border-primary/50 bg-primary/10 text-primary flex items-start gap-2 rounded-md border p-3 text-sm"
          >
            <AlertTriangleIcon class="mt-0.5 size-4 shrink-0" />
            <div>
              <p class="font-medium">Active Theme Warning</p>
              <p class="text-primary/80 mt-1 text-xs">
                You are about to delete your active theme. Your appearance will be reset to the
                Light theme after deletion.
              </p>
            </div>
          </div>
        {/if}
      {/if}

      {#if deleteErrorMessage}
        <div
          class="bg-destructive/10 text-destructive border-destructive/50 flex items-start gap-2 rounded-md border p-3 text-sm"
        >
          <AlertTriangleIcon class="mt-0.5 size-4 shrink-0" />
          <div>
            <p class="font-medium">Delete Failed</p>
            <p class="text-destructive/80 text-xs">{deleteErrorMessage}</p>
          </div>
        </div>
      {/if}
    </div>

    <Dialog.Footer class="gap-2 sm:gap-0">
      <Button
        variant="outline"
        onclick={() => {
          if (!isDeleting) deleteDialogOpen = false;
        }}
        disabled={isDeleting}
        class="flex-1 sm:flex-none"
      >
        Cancel
      </Button>
      <Button
        variant="destructive"
        onclick={handleDeleteTheme}
        disabled={isDeleting}
        class="flex-1 sm:flex-none"
      >
        {#if isDeleting}
          <Loader2Icon class="mr-2 size-4 animate-spin" />
          Deleting...
        {:else}
          <Trash2Icon class="mr-2 size-4" />
          Delete Theme
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
