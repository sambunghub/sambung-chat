<script lang="ts">
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
  import InfoIcon from '@lucide/svelte/icons/info';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import OctagonXIcon from '@lucide/svelte/icons/octagon-x';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

  import { Toaster as Sonner, type ToasterProps as SonnerProps } from 'svelte-sonner';
  import { mode } from 'mode-watcher';

  let { ...restProps }: SonnerProps = $props();

  // Get current mode from mode-watcher, default to 'dark' if not initialized
  const currentMode = $derived(mode.current ?? 'dark');

  // Toast colors for light/dark themes
  // Light: darker backgrounds for contrast on light theme
  // Dark: MUCH lighter backgrounds (0.55-0.65) for visibility on dark theme (0.15 bg)
  const toastStyle = $derived(
    currentMode === 'dark'
      ? `
				--normal-bg: oklch(0.35 0 0);
				--normal-text: oklch(0.98 0 0);
				--normal-border: oklch(0.45 0 0);
				--success-bg: oklch(0.55 0.18 142);
				--success-text: oklch(0.99 0 0);
				--success-border: oklch(0.65 0.2 142);
				--error-bg: oklch(0.55 0.22 27);
				--error-text: oklch(0.99 0 0);
				--error-border: oklch(0.65 0.25 27);
				--warning-bg: oklch(0.55 0.18 48);
				--warning-text: oklch(0.99 0 0);
				--warning-border: oklch(0.65 0.22 48);
				--info-bg: oklch(0.55 0.16 240);
				--info-text: oklch(0.99 0 0);
				--info-border: oklch(0.65 0.2 240);
				`
      : `
				--normal-bg: oklch(0.92 0 0);
				--normal-text: oklch(0.15 0 0);
				--normal-border: oklch(0.82 0 0);
				--success-bg: oklch(0.88 0.12 142);
				--success-text: oklch(0.2 0 0);
				--success-border: oklch(0.78 0.1 142);
				--error-bg: oklch(0.88 0.15 27);
				--error-text: oklch(0.2 0 0);
				--error-border: oklch(0.78 0.12 27);
				--warning-bg: oklch(0.88 0.12 48);
				--warning-text: oklch(0.2 0 0);
				--warning-border: oklch(0.78 0.1 48);
				--info-bg: oklch(0.88 0.1 240);
				--info-text: oklch(0.2 0 0);
				--info-border: oklch(0.78 0.08 240);
				`
  );
</script>

<Sonner
  theme={currentMode}
  position="top-right"
  class="toaster group"
  style={toastStyle}
  toastOptions={{
    classes: {
      toast: 'min-w-[320px] p-4 rounded-lg shadow-lg',
      title: 'text-sm font-semibold',
      description: 'text-sm opacity-90',
      actionButton: 'bg-primary text-primary-foreground hover:bg-primary/90',
      cancelButton: 'bg-muted text-muted-foreground hover:bg-muted/80',
      closeButton:
        'absolute right-2 top-2 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity',
    },
  }}
  {...restProps}
>
  {#snippet loadingIcon()}
    <Loader2Icon class="size-4 animate-spin" />
  {/snippet}
  {#snippet successIcon()}
    <CircleCheckIcon class="size-4" />
  {/snippet}
  {#snippet errorIcon()}
    <OctagonXIcon class="size-4" />
  {/snippet}
  {#snippet infoIcon()}
    <InfoIcon class="size-4" />
  {/snippet}
  {#snippet warningIcon()}
    <TriangleAlertIcon class="size-4" />
  {/snippet}
</Sonner>
