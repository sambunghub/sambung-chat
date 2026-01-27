<script lang="ts">
  /**
   * Error Display Component
   *
   * Shows user-friendly error messages with appropriate icons and actions.
   * Supports different error types with visual distinction and actionable buttons.
   */

  import { Button } from '$lib/components/ui/button/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
  import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
  import InfoIcon from '@lucide/svelte/icons/info';
  import XCircleIcon from '@lucide/svelte/icons/x-circle';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import XIcon from '@lucide/svelte/icons/x';

  interface Props {
    /** Error message to display */
    message: string;
    /** Error code for categorization (optional) */
    code?: string;
    /** Type of error for visual styling */
    type?: 'error' | 'warning' | 'info';
    /** Whether to show a dismiss button */
    dismissible?: boolean;
    /** Optional callback for retry action */
    onRetry?: () => void;
    /** Optional callback for settings action */
    onSettings?: () => void;
    /** Optional callback for dismiss action */
    onDismiss?: () => void;
  }

  let {
    message,
    code,
    type = 'error',
    dismissible = true,
    onRetry,
    onSettings,
    onDismiss,
  }: Props = $props();

  // Determine styling based on error type
  let containerClasses = $derived(() => {
    const base = 'rounded-lg border p-4 flex items-start gap-3';
    if (type === 'warning') {
      return `${base} bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400`;
    }
    if (type === 'info') {
      return `${base} bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400`;
    }
    return `${base} bg-destructive/10 border-destructive/20 text-destructive`;
  });

  // Get user-friendly title based on error code
  let errorTitle = $derived(() => {
    if (code === 'TOO_MANY_REQUESTS') return 'Rate Limit Exceeded';
    if (code === 'UNAUTHORIZED') return 'Authentication Failed';
    if (code === 'NOT_FOUND') return 'Resource Not Found';
    if (code === 'BAD_REQUEST') return 'Invalid Request';
    if (code === 'SERVICE_UNAVAILABLE') return 'Service Unavailable';
    if (code === 'INTERNAL_SERVER_ERROR') return 'Server Error';
    if (type === 'warning') return 'Warning';
    if (type === 'info') return 'Information';
    return 'Error';
  });

  // Get helpful hint based on error code
  let errorHint = $derived(() => {
    if (code === 'TOO_MANY_REQUESTS') {
      return 'Please wait a moment before trying again.';
    }
    if (code === 'UNAUTHORIZED') {
      return 'Please check your API credentials in settings.';
    }
    if (code === 'NOT_FOUND') {
      return 'The requested resource was not found.';
    }
    if (code === 'SERVICE_UNAVAILABLE') {
      return 'The service is temporarily unavailable. Please try again later.';
    }
    return null;
  });
</script>

<div class={containerClasses()}>
  {#if type === 'warning' || code === 'TOO_MANY_REQUESTS'}
    <div class="shrink-0 pt-0.5">
      <AlertTriangleIcon class="size-5" />
    </div>
  {:else if type === 'info'}
    <div class="shrink-0 pt-0.5">
      <InfoIcon class="size-5" />
    </div>
  {:else if code === 'UNAUTHORIZED'}
    <div class="shrink-0 pt-0.5">
      <XCircleIcon class="size-5" />
    </div>
  {:else}
    <div class="shrink-0 pt-0.5">
      <AlertCircleIcon class="size-5" />
    </div>
  {/if}

  <div class="min-w-0 flex-1">
    <div class="flex items-center gap-2 text-sm font-medium">
      <span>{errorTitle()}</span>
      {#if code}
        <span class="font-mono text-xs opacity-70">({code})</span>
      {/if}
    </div>

    <p class="mt-1 text-sm opacity-90">
      {message}
    </p>

    {#if errorHint()}
      <p class="mt-2 text-xs opacity-75">
        💡 {errorHint()}
      </p>
    {/if}

    {#if onRetry || onSettings}
      <div class="mt-3 flex gap-2">
        {#if onRetry}
          <Button type="button" size="sm" variant="outline" onclick={onRetry} class="gap-1.5">
            <RefreshCwIcon class="size-3.5" />
            <span>Retry</span>
          </Button>
        {/if}

        {#if onSettings}
          <Button type="button" size="sm" variant="ghost" onclick={onSettings} class="gap-1.5">
            <SettingsIcon class="size-3.5" />
            <span>Settings</span>
          </Button>
        {/if}
      </div>
    {/if}
  </div>

  {#if dismissible && onDismiss}
    <button
      type="button"
      onclick={onDismiss}
      class="shrink-0 opacity-70 transition-opacity hover:opacity-100"
      aria-label="Dismiss error"
    >
      <XIcon class="size-4" />
    </button>
  {/if}
</div>
