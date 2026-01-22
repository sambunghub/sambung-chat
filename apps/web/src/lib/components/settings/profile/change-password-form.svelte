<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import CheckIcon from '@lucide/svelte/icons/check';
  import type { ChangePasswordFormData } from './types.js';

  // Props for the change password form component
  interface Props {
    // Whether the form is currently submitting
    submitting?: boolean;
    // Callback when form is submitted
    onsubmit: (data: ChangePasswordFormData) => void | Promise<void>;
    // Callback when form is cancelled
    oncancel?: () => void;
    // Error message from server
    error?: string;
  }

  let { submitting = false, onsubmit, oncancel, error }: Props = $props();

  // Local form state
  let formData = $state<ChangePasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Validation errors
  let validationErrors = $state<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Show password toggles
  let showCurrentPassword = $state(false);
  let showNewPassword = $state(false);
  let showConfirmPassword = $state(false);

  // Validate form data
  function validateForm(): boolean {
    validationErrors = {};

    // Validate current password
    if (!formData.currentPassword.trim()) {
      validationErrors.currentPassword = 'Current password is required';
    }

    // Validate new password
    if (!formData.newPassword.trim()) {
      validationErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      validationErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      validationErrors.newPassword =
        'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Validate confirm password
    if (!formData.confirmPassword.trim()) {
      validationErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.confirmPassword !== formData.newPassword) {
      validationErrors.confirmPassword = 'Passwords do not match';
    }

    return Object.keys(validationErrors).length === 0;
  }

  // Clear validation error when user starts typing
  function clearValidationError(field: keyof ChangePasswordFormData) {
    if (validationErrors[field]) {
      validationErrors = { ...validationErrors, [field]: undefined };
    }
  }

  // Handle form submission
  async function handleSubmit() {
    if (!validateForm() || submitting) return;

    try {
      await onsubmit(formData);
    } catch (error) {
      // Error is handled by parent component
    }
  }

  // Handle cancel
  function handleCancel() {
    formData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
    validationErrors = {};
    oncancel?.();
  }
</script>

<div class="space-y-4">
  <!-- Server Error -->
  {#if error}
    <div
      class="bg-destructive/15 border-destructive text-destructive rounded-md border p-3 text-sm"
    >
      {error}
    </div>
  {/if}

  <!-- Current Password -->
  <div class="space-y-2">
    <Label for="current-password">Current Password</Label>
    <div class="relative">
      <Input
        id="current-password"
        bind:value={formData.currentPassword}
        type={showCurrentPassword ? 'text' : 'password'}
        placeholder="Enter your current password"
        autocomplete="current-password"
        required
        disabled={submitting}
        class="pr-10 disabled:cursor-not-allowed disabled:opacity-50"
        oninput={() => clearValidationError('currentPassword')}
      />
      <button
        type="button"
        onclick={() => (showCurrentPassword = !showCurrentPassword)}
        disabled={submitting}
        class="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
      >
        {#if showCurrentPassword}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path
              d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
            />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" x2="22" y1="2" y2="22" />
          </svg>
        {:else}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        {/if}
      </button>
    </div>
    {#if validationErrors.currentPassword}
      <p class="text-destructive text-xs">{validationErrors.currentPassword}</p>
    {/if}
  </div>

  <!-- New Password -->
  <div class="space-y-2">
    <Label for="new-password">New Password</Label>
    <div class="relative">
      <Input
        id="new-password"
        bind:value={formData.newPassword}
        type={showNewPassword ? 'text' : 'password'}
        placeholder="Enter your new password"
        autocomplete="new-password"
        required
        disabled={submitting}
        class="pr-10 disabled:cursor-not-allowed disabled:opacity-50"
        oninput={() => clearValidationError('newPassword')}
      />
      <button
        type="button"
        onclick={() => (showNewPassword = !showNewPassword)}
        disabled={submitting}
        class="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
      >
        {#if showNewPassword}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path
              d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
            />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" x2="22" y1="2" y2="22" />
          </svg>
        {:else}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        {/if}
      </button>
    </div>
    {#if validationErrors.newPassword}
      <p class="text-destructive text-xs">{validationErrors.newPassword}</p>
    {:else}
      <p class="text-muted-foreground text-xs">
        Must be at least 8 characters with uppercase, lowercase, and number
      </p>
    {/if}
  </div>

  <!-- Confirm Password -->
  <div class="space-y-2">
    <Label for="confirm-password">Confirm New Password</Label>
    <div class="relative">
      <Input
        id="confirm-password"
        bind:value={formData.confirmPassword}
        type={showConfirmPassword ? 'text' : 'password'}
        placeholder="Confirm your new password"
        autocomplete="new-password"
        required
        disabled={submitting}
        class="pr-10 disabled:cursor-not-allowed disabled:opacity-50"
        oninput={() => clearValidationError('confirmPassword')}
      />
      <button
        type="button"
        onclick={() => (showConfirmPassword = !showConfirmPassword)}
        disabled={submitting}
        class="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
      >
        {#if showConfirmPassword}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path
              d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
            />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" x2="22" y1="2" y2="22" />
          </svg>
        {:else}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        {/if}
      </button>
    </div>
    {#if validationErrors.confirmPassword}
      <p class="text-destructive text-xs">{validationErrors.confirmPassword}</p>
    {/if}
  </div>
</div>

<div class="bg-muted/30 flex justify-end gap-2 border-t p-4">
  {#if oncancel}
    <Button variant="outline" onclick={handleCancel} disabled={submitting}>Cancel</Button>
  {/if}
  <Button onclick={handleSubmit} disabled={submitting}>
    <CheckIcon class="mr-2 size-4" />
    {submitting ? 'Changing Password...' : 'Change Password'}
  </Button>
</div>
