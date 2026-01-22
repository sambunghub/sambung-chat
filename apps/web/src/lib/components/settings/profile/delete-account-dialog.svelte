<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
  import CheckIcon from '@lucide/svelte/icons/check';

  // Props for the delete account dialog component
  interface Props {
    // Whether the dialog is open
    open: boolean;
    // Callback when dialog open state changes
    onopenchange: (open: boolean) => void;
    // Whether deletion is in progress
    deleting?: boolean;
    // Callback when delete is confirmed
    ondelete: () => void | Promise<void>;
  }

  let { open, onopenchange, deleting = false, ondelete }: Props = $props();

  // Confirmation checkbox state
  let confirmed = $state(false);

  // Reset confirmation state when dialog opens/closes
  $effect(() => {
    if (!open) {
      confirmed = false;
    }
  });

  // Handle delete button click
  async function handleDelete() {
    if (!confirmed || deleting) return;

    try {
      await ondelete();
      // Dialog will be closed by parent component after successful deletion
    } catch (error) {
      // Error is handled by parent component
    }
  }
</script>

<Dialog.Root bind:open onOpenChange={onopenchange}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <AlertTriangleIcon class="text-destructive size-5" />
        Delete Account
      </Dialog.Title>
      <Dialog.Description>
        This action cannot be undone. Please read the following information carefully.
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 py-4">
      <!-- Warning Message -->
      <div class="bg-destructive/15 border-destructive rounded-md border p-4">
        <h4 class="text-destructive mb-2 text-sm font-semibold">Warning</h4>
        <ul class="text-destructive space-y-1 text-xs">
          <li>• All your personal data will be permanently deleted</li>
          <li>• All chat history and messages will be removed</li>
          <li>• All API keys and configurations will be deleted</li>
          <li>• You will be immediately logged out</li>
          <li>• This action cannot be undone</li>
        </ul>
      </div>

      <!-- Confirmation Checkbox -->
      <div class="flex items-start gap-3">
        <input
          type="checkbox"
          id="delete-confirmation"
          bind:checked={confirmed}
          disabled={deleting}
          class="border-primary focus:ring-primary h-4 w-4 rounded border"
        />
        <div class="grid gap-1.5 leading-none">
          <Label
            for="delete-confirmation"
            class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I understand the consequences and want to delete my account
          </Label>
          <p class="text-muted-foreground text-xs">
            By checking this box, you confirm that you want to permanently delete your account and
            all associated data.
          </p>
        </div>
      </div>
    </div>

    <Dialog.Footer class="flex gap-2 sm:justify-end">
      <Button variant="outline" onclick={() => onopenchange(false)} disabled={deleting}>
        Cancel
      </Button>
      <Button
        variant="destructive"
        onclick={handleDelete}
        disabled={!confirmed || deleting}
        class="gap-2"
      >
        <CheckIcon class="size-4" />
        {deleting ? 'Deleting Account...' : 'Delete Account'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
