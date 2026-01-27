<script lang="ts">
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from '$lib/components/ui/card/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { appearance, type MessageDensity } from '$lib/stores/appearance.store.js';
  import { cn } from '$lib/utils.js';
  import { CheckIcon, Minimize2Icon, Maximize2Icon } from '@lucide/svelte';
  import Layers from '@lucide/svelte/icons/layers';

  /**
   * Message density option interface
   */
  interface DensityOption {
    value: MessageDensity;
    label: string;
    description: string;
    icon: typeof Layers;
    spacing: {
      messagePadding: string;
      messageGap: string;
      avatarSize: string;
    };
  }

  // Message density options with their visual characteristics
  const DENSITY_OPTIONS: DensityOption[] = [
    {
      value: 'compact',
      label: 'Compact',
      description: 'Tight spacing for maximum content visibility',
      icon: Minimize2Icon,
      spacing: {
        messagePadding: '0.5rem 0.75rem',
        messageGap: '0.25rem',
        avatarSize: '1.25rem',
      },
    },
    {
      value: 'comfortable',
      label: 'Comfortable',
      description: 'Balanced spacing for optimal readability',
      icon: Layers,
      spacing: {
        messagePadding: '0.75rem 1rem',
        messageGap: '0.75rem',
        avatarSize: '1.75rem',
      },
    },
    {
      value: 'spacious',
      label: 'Spacious',
      description: 'Generous spacing for a relaxed viewing experience',
      icon: Maximize2Icon,
      spacing: {
        messagePadding: '1rem 1.25rem',
        messageGap: '1.25rem',
        avatarSize: '2rem',
      },
    },
  ];

  /**
   * Component props
   */
  interface Props {
    /** Additional CSS classes for the container */
    class?: string;
    /** Whether to show the description for each density */
    showDescription?: boolean;
  }

  let { class: className, showDescription = true }: Props = $props();

  // Local state for immediate feedback before store update
  let localValue = $state<MessageDensity>(appearance.currentSettings.messageDensity);

  // Sync local state with store
  $effect(() => {
    localValue = appearance.currentSettings.messageDensity;
  });

  /**
   * Handle density selection
   */
  function handleDensitySelect(value: MessageDensity) {
    localValue = value;
    appearance.updateSetting('messageDensity', value);
  }

  /**
   * Get selected density option
   */
  const selectedOption = $derived(
    DENSITY_OPTIONS.find((option) => option.value === localValue) || DENSITY_OPTIONS[1]
  );
</script>

<Card class={cn('overflow-hidden', className)}>
  <CardHeader class="space-y-1 pb-4">
    <div class="flex items-center gap-2">
      <Layers class="text-muted-foreground size-5" />
      <CardTitle class="text-lg">Message Density</CardTitle>
    </div>
    <CardDescription>
      Control the spacing and layout of messages in your conversations
    </CardDescription>
  </CardHeader>

  <CardContent class="space-y-4">
    <!-- Density Options -->
    <div class="space-y-2">
      <Label class="text-sm font-medium">Select Density</Label>

      <div class="grid gap-3">
        {#each DENSITY_OPTIONS as option}
          <button
            onclick={() => handleDensitySelect(option.value)}
            class="border-input hover:border-primary hover:bg-accent/50 data-[selected=true]:border-primary data-[selected=true]:bg-primary/5 data-[selected=true]:ring-primary relative flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-left transition-all data-[selected=true]:ring-1"
            data-selected={localValue === option.value}
            aria-pressed={localValue === option.value}
            type="button"
          >
            <!-- Selection indicator -->
            <div class="text-primary mt-0.5">
              <div
                class="border-primary data-[selected=true]:bg-primary flex size-4 items-center justify-center rounded-full border-2"
                data-selected={localValue === option.value}
              >
                {#if localValue === option.value}
                  <CheckIcon class="size-3" />
                {/if}
              </div>
            </div>

            <!-- Density info -->
            <div class="flex-1 space-y-2">
              <div class="flex items-center gap-2">
                <span class="font-semibold">{option.label}</span>
                <span class="text-muted-foreground text-xs uppercase">
                  {option.value}
                </span>
              </div>

              {#if showDescription}
                <p class="text-muted-foreground text-sm leading-relaxed">
                  {option.description}
                </p>
              {/if}

              <!-- Visual preview of the density -->
              <div
                class="border-border bg-muted/50 mt-2 flex items-center gap-2 rounded border p-2"
              >
                <div
                  class="bg-primary/20 flex flex-shrink-0 items-center justify-center rounded-full"
                  style="width: {option.spacing.avatarSize}; height: {option.spacing.avatarSize};"
                >
                  <div class="text-primary text-xs font-bold">U</div>
                </div>
                <div
                  class="bg-background rounded-md"
                  style="padding: {option.spacing.messagePadding}; gap: {option.spacing
                    .messageGap}; display: flex; flex-direction: column; flex: 1;"
                >
                  <div class="bg-muted h-2 w-3/4 rounded"></div>
                  <div class="bg-muted h-2 w-1/2 rounded"></div>
                </div>
              </div>
            </div>
          </button>
        {/each}
      </div>
    </div>

    <!-- Current Selection Summary -->
    <div class="border-border bg-muted/30 rounded-lg border p-3">
      <p class="text-muted-foreground mb-1 text-xs font-medium uppercase">Current Selection</p>
      <p class="text-foreground text-base font-semibold">
        {selectedOption.label}
        <span class="text-muted-foreground font-normal"> ({selectedOption.value})</span>
      </p>
      <p class="text-muted-foreground mt-1 text-xs">
        {selectedOption.description}
      </p>
    </div>
  </CardContent>
</Card>
