<script lang="ts">
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from '$lib/components/ui/card/index.js';
  import { appearance, type MessageDensity } from '$lib/stores/appearance.store.js';
  import { cn } from '$lib/utils.js';
  import { UserIcon, BotIcon, EyeIcon } from '@lucide/svelte';
  import { browser } from '$app/environment';

  /**
   * Component props
   */
  interface Props {
    /** Additional CSS classes for the container */
    class?: string;
    /** Custom title for the preview card */
    title?: string;
    /** Custom description for the preview card */
    description?: string;
    /** Whether to show the density indicator */
    showDensityIndicator?: boolean;
  }

  let {
    class: className,
    title = 'Live Preview',
    description = 'See how your settings affect message appearance',
    showDensityIndicator = true,
  }: Props = $props();

  /**
   * Message density spacing configurations
   */
  const DENSITY_SPACING: Record<
    MessageDensity,
    { messagePadding: string; messageGap: string; avatarSize: string; textSize: string }
  > = {
    compact: {
      messagePadding: '0.5rem 0.75rem',
      messageGap: '0.5rem',
      avatarSize: '1.25rem',
      textSize: '0.875rem',
    },
    comfortable: {
      messagePadding: '0.75rem 1rem',
      messageGap: '0.75rem',
      avatarSize: '1.75rem',
      textSize: '0.9375rem',
    },
    spacious: {
      messagePadding: '1rem 1.25rem',
      messageGap: '1.25rem',
      avatarSize: '2rem',
      textSize: '1rem',
    },
  };

  /**
   * Sample conversation messages for preview
   */
  const sampleMessages = [
    {
      role: 'user' as const,
      content: 'Can you help me understand how message density works?',
    },
    {
      role: 'assistant' as const,
      content:
        'Of course! Message density controls the spacing and layout of messages in your conversations. You can choose between compact, comfortable, and spacious options to suit your reading preference.',
    },
    {
      role: 'user' as const,
      content: 'That sounds great! What about font size and family?',
    },
    {
      role: 'assistant' as const,
      content:
        'Font size adjusts the text size from 12px to 20px, while font family lets you choose between system-ui, sans-serif, or monospace fonts. These settings help personalize your reading experience.',
    },
  ];

  /**
   * Get font family CSS value
   */
  function getFontFamily(fontFamily: string): string {
    switch (fontFamily) {
      case 'system-ui':
        return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      case 'sans-serif':
        return '"Helvetica Neue", Arial, sans-serif';
      case 'monospace':
        return '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace';
      default:
        return 'system-ui, -apple-system, sans-serif';
    }
  }

  /**
   * Get current density spacing
   */
  const currentSpacing = $derived(DENSITY_SPACING[appearance.currentSettings.messageDensity]);

  /**
   * Get font size with px unit
   */
  const fontSizePx = $derived(`${appearance.currentSettings.fontSize}px`);

  /**
   * Get font family CSS
   */
  const fontFamilyCss = $derived(getFontFamily(appearance.currentSettings.fontFamily));

  /**
   * Get density label
   */
  const densityLabel = $derived(
    appearance.currentSettings.messageDensity.charAt(0).toUpperCase() +
      appearance.currentSettings.messageDensity.slice(1)
  );
</script>

<Card class={cn('overflow-hidden', className)}>
  <CardHeader class="space-y-1 pb-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <EyeIcon class="text-muted-foreground size-5" />
        <CardTitle class="text-lg">{title}</CardTitle>
      </div>
      {#if showDensityIndicator}
        <div class="text-muted-foreground text-xs font-medium uppercase">
          {densityLabel}
        </div>
      {/if}
    </div>
    <CardDescription>
      {description}
    </CardDescription>
  </CardHeader>

  <CardContent>
    <!-- Preview Container -->
    <div class="border-border bg-muted/30 rounded-lg border p-4">
      <div class="space-y-0" style="gap: {currentSpacing.messageGap};">
        {#each sampleMessages as message}
          <div
            class="group flex items-start gap-3"
            style="padding: {currentSpacing.messagePadding};"
          >
            <!-- Avatar -->
            <div
              class="flex flex-shrink-0 items-center justify-center rounded-full"
              style="
                width: {currentSpacing.avatarSize};
                height: {currentSpacing.avatarSize};
                background-color: hsl(var(--primary) / 0.1);
                color: hsl(var(--primary));
                font-size: calc({currentSpacing.avatarSize} * 0.5);
              "
            >
              {#if message.role === 'user'}
                <UserIcon class="size-4" />
              {:else}
                <BotIcon class="size-4" />
              {/if}
            </div>

            <!-- Message Content -->
            <div class="flex-1 space-y-1 overflow-hidden">
              <!-- Role Label -->
              <p
                class="text-muted-foreground text-xs font-semibold uppercase"
                style="font-size: calc({fontSizePx} * 0.75); font-family: {fontFamilyCss};"
              >
                {message.role}
              </p>

              <!-- Message Text -->
              <p
                class="text-foreground leading-relaxed"
                style="
                  font-size: {fontSizePx};
                  font-family: {fontFamilyCss};
                "
              >
                {message.content}
              </p>
            </div>
          </div>
        {/each}
      </div>

      <!-- Settings Summary -->
      <div
        class="border-border mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3"
      >
        <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <div class="flex items-center gap-1">
            <span class="text-muted-foreground">Font Size:</span>
            <span class="text-foreground font-medium">{appearance.currentSettings.fontSize}px</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="text-muted-foreground">Family:</span>
            <span class="text-foreground font-medium">{appearance.currentSettings.fontFamily}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="text-muted-foreground">Density:</span>
            <span class="text-foreground font-medium"
              >{appearance.currentSettings.messageDensity}</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Tips Section -->
    {#if browser}
      <div class="bg-muted/50 mt-3 rounded-md p-3">
        <p class="text-muted-foreground text-xs leading-relaxed">
          <span class="font-semibold">Tip:</span> Adjust the settings above to see real-time changes in
          this preview. The preview shows how messages will appear in your conversations.
        </p>
      </div>
    {/if}
  </CardContent>
</Card>
