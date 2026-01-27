<script lang="ts">
  import MessageDensitySetting from '$lib/components/settings/message-density-setting.svelte';
  import { appearance } from '$lib/stores/appearance.store.js';
  import { onMount } from 'svelte';

  let currentSettings = $derived(appearance.currentSettings);

  onMount(() => {
    console.log('Current settings:', currentSettings);
    console.log('Current message density:', currentSettings.messageDensity);
  });

  // Sample messages to demonstrate density
  const sampleMessages = [
    {
      role: 'user',
      content: 'What is the capital of France?',
    },
    {
      role: 'assistant',
      content:
        'The capital of France is Paris. It is known for its art, fashion, gastronomy, and culture.',
    },
    {
      role: 'user',
      content: 'Can you tell me more about its landmarks?',
    },
    {
      role: 'assistant',
      content:
        'Paris is home to iconic landmarks such as the Eiffel Tower, the Louvre Museum, Notre-Dame Cathedral, and the Arc de Triomphe. The city is also known for its cafes and beautiful architecture along the Seine River.',
    },
  ];

  // Get spacing based on current density
  const getDensityStyles = () => {
    switch (currentSettings.messageDensity) {
      case 'compact':
        return {
          messagePadding: '0.5rem 0.75rem',
          messageGap: '0.25rem',
          avatarSize: '1.25rem',
          fontSize: '0.875rem',
        };
      case 'comfortable':
        return {
          messagePadding: '0.75rem 1rem',
          messageGap: '0.75rem',
          avatarSize: '1.75rem',
          fontSize: '1rem',
        };
      case 'spacious':
        return {
          messagePadding: '1rem 1.25rem',
          messageGap: '1.25rem',
          avatarSize: '2rem',
          fontSize: '1rem',
        };
      default:
        return {
          messagePadding: '0.75rem 1rem',
          messageGap: '0.75rem',
          avatarSize: '1.75rem',
          fontSize: '1rem',
        };
    }
  };

  const densityStyles = $derived(getDensityStyles());
</script>

<div class="container mx-auto max-w-3xl p-6">
  <div class="mb-8">
    <h1 class="text-foreground text-3xl font-bold">Message Density Setting Test</h1>
    <p class="text-muted-foreground mt-2">This page tests the message density selector component</p>
  </div>

  <div class="space-y-8">
    <!-- Message Density Component -->
    <MessageDensitySetting />

    <!-- Debug Info -->
    <div class="border-border bg-muted/50 rounded-lg border p-4">
      <h2 class="text-foreground mb-3 text-lg font-semibold">Current Settings</h2>
      <pre class="text-sm">{JSON.stringify(currentSettings, null, 2)}</pre>
      <p class="text-muted-foreground mt-3 text-sm">
        <strong>Message Density:</strong>
        {currentSettings.messageDensity}
      </p>
    </div>

    <!-- Live Preview of Different Densities -->
    <div class="border-border rounded-lg border p-6">
      <h2 class="text-foreground mb-4 text-xl font-semibold">Message Density Preview</h2>

      <div class="space-y-0" style="gap: {densityStyles.messageGap};">
        {#each sampleMessages as message}
          <div
            class="border-border flex gap-3 rounded-lg border p-4 transition-all"
            style="padding: {densityStyles.messagePadding};"
          >
            <!-- Avatar -->
            <div
              class="bg-primary/20 flex flex-shrink-0 items-center justify-center rounded-full"
              style="width: {densityStyles.avatarSize}; height: {densityStyles.avatarSize};"
            >
              <div class="text-primary text-xs font-bold">
                {message.role === 'user' ? 'U' : 'A'}
              </div>
            </div>

            <!-- Message content -->
            <div class="flex-1 space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-muted-foreground text-xs font-semibold uppercase">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </span>
              </div>
              <p
                class="text-foreground leading-relaxed"
                style="font-size: {densityStyles.fontSize};"
              >
                {message.content}
              </p>
            </div>
          </div>
        {/each}
      </div>

      <div class="border-border mt-4 border-t pt-4">
        <p class="text-muted-foreground text-sm">
          <strong>Note:</strong> This preview demonstrates how messages will appear with the selected
          density setting. Change the density above to see the difference!
        </p>
      </div>
    </div>

    <!-- Comparison Section -->
    <div class="border-border rounded-lg border p-6">
      <h2 class="text-foreground mb-4 text-xl font-semibold">Density Comparison</h2>

      <div class="grid gap-4 md:grid-cols-3">
        <!-- Compact -->
        <div class="border-border rounded-lg border p-3">
          <h3 class="text-foreground mb-2 text-sm font-semibold">Compact</h3>
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <div class="bg-primary/20 size-5 rounded-full"></div>
              <div class="bg-muted h-2 flex-1 rounded"></div>
            </div>
            <div class="flex items-center gap-2">
              <div class="bg-muted/50 size-5 rounded-full"></div>
              <div class="bg-muted h-2 flex-1 rounded"></div>
            </div>
          </div>
          <p class="text-muted-foreground mt-2 text-xs">Best for: Maximum content visibility</p>
        </div>

        <!-- Comfortable -->
        <div class="border-border rounded-lg border p-3">
          <h3 class="text-foreground mb-2 text-sm font-semibold">Comfortable</h3>
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <div class="bg-primary/20 size-7 rounded-full"></div>
              <div class="bg-muted h-2 flex-1 rounded"></div>
            </div>
            <div class="flex items-center gap-2">
              <div class="bg-muted/50 size-7 rounded-full"></div>
              <div class="bg-muted h-2 flex-1 rounded"></div>
            </div>
          </div>
          <p class="text-muted-foreground mt-2 text-xs">Best for: Balanced readability</p>
        </div>

        <!-- Spacious -->
        <div class="border-border rounded-lg border p-3">
          <h3 class="text-foreground mb-2 text-sm font-semibold">Spacious</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <div class="bg-primary/20 size-8 rounded-full"></div>
              <div class="bg-muted h-2 flex-1 rounded"></div>
            </div>
            <div class="flex items-center gap-2">
              <div class="bg-muted/50 size-8 rounded-full"></div>
              <div class="bg-muted h-2 flex-1 rounded"></div>
            </div>
          </div>
          <p class="text-muted-foreground mt-2 text-xs">Best for: Relaxed viewing experience</p>
        </div>
      </div>
    </div>

    <!-- Usage Recommendations -->
    <div class="border-border bg-muted/30 rounded-lg border p-6">
      <h2 class="text-foreground mb-3 text-lg font-semibold">Usage Recommendations</h2>
      <ul class="text-muted-foreground ml-6 list-disc space-y-2 text-sm">
        <li>
          <strong>Compact:</strong> Ideal when you need to see many messages at once, such as reviewing
          long conversations or technical discussions
        </li>
        <li>
          <strong>Comfortable:</strong> Recommended for everyday use, providing a good balance between
          content density and readability
        </li>
        <li>
          <strong>Spacious:</strong> Perfect for casual reading, longer messages, or when you prefer a
          more relaxed interface with breathing room
        </li>
      </ul>
    </div>
  </div>
</div>
