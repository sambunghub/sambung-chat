<script lang="ts">
  import { onMount } from 'svelte';
  import { orpc } from '$lib/orpc';
  import SecondarySidebarTrigger from '$lib/components/secondary-sidebar-trigger.svelte';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
  import MailIcon from '@lucide/svelte/icons/mail';
  import { page } from '$app/stores';
  import { ProfileForm, AvatarUpload, ChangePasswordForm, SessionsList, type ProfileFormData, type ChangePasswordFormData, type SessionData } from '$lib/components/settings/profile';
  import { toast } from 'svelte-sonner';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';

  // Type assertion for user router (temporary workaround until types are regenerated)
  const userClient = orpc as any & {
    user: {
      getProfile: () => Promise<any>;
      updateProfile: (input: any) => Promise<any>;
      uploadAvatar: (input: { file: string }) => Promise<any>;
      changePassword: (input: any) => Promise<any>;
      getSessions: () => Promise<any[]>;
      revokeSession: (input: { token: string }) => Promise<void>;
      deleteAccount: () => Promise<void>;
    },
  };

  type UserProfile = {
    id: string;
    name: string;
    email: string;
    bio: string | null;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  };

  let userProfile = $state<UserProfile | null>(null);
  let loading = $state(false);
  let submitting = $state(false);
  let changingPassword = $state(false);
  let showChangePasswordDialog = $state(false);
  let passwordError = $state('');
  let showDeleteAccountDialog = $state(false);
  let deletingAccount = $state(false);

  // Sessions state
  let sessions = $state<SessionData[]>([]);
  let sessionsLoading = $state(false);

  // Avatar state
  let selectedAvatarFile = $state<File | null>(null);
  let avatarPreview = $state<string | null>(null);
  let uploadingAvatar = $state(false);

  // Form data
  let formData = $state<ProfileFormData>({
    name: '',
    bio: '',
  });

  onMount(async () => {
    await loadProfile();
    await loadSessions();
  });

  async function loadProfile() {
    loading = true;
    try {
      const result = await userClient.user.getProfile();
      userProfile = result as UserProfile;
      formData = {
        name: userProfile.name || '',
        bio: userProfile.bio || '',
      };
    } catch (error) {
      toast.error('Failed to load profile', {
        description: error instanceof Error ? error.message : 'Please try again later',
        action: {
          label: 'Retry',
          onClick: () => loadProfile(),
        },
      });
    } finally {
      loading = false;
    }
  }

  async function handleAvatarFileSelect(file: File | null) {
    selectedAvatarFile = file;

    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        avatarPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      avatarPreview = null;
    }
  }

  async function handleAvatarUpload(file: File) {
    uploadingAvatar = true;

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;

      try {
        await userClient.user.uploadAvatar({ file: base64 });

        // Reload profile to get updated avatar
        await loadProfile();

        // Clear preview and selected file
        avatarPreview = null;
        selectedAvatarFile = null;

        toast.success('Avatar uploaded successfully', {
          description: 'Your profile picture has been updated',
        });
      } catch (error) {
        toast.error('Failed to upload avatar', {
          description: error instanceof Error ? error.message : 'Please try again',
          action: {
            label: 'Retry',
            onClick: () => handleAvatarUpload(file),
          },
        });
      } finally {
        uploadingAvatar = false;
      }
    };

    reader.readAsDataURL(file);
  }

  async function handleSave(data: ProfileFormData) {
    submitting = true;

    // Store previous state for rollback
    const previousProfile = userProfile ? { ...userProfile } : null;
    const previousFormData = { ...formData };
    const previousAvatar = userProfile?.image || null;

    // Optimistic update
    if (userProfile) {
      userProfile = {
        ...userProfile,
        name: data.name,
        bio: data.bio || null,
        image: avatarPreview || userProfile.image,
        updatedAt: new Date(),
      };
    }
    formData = { ...data };

    try {
      // Upload avatar first if one was selected
      if (selectedAvatarFile) {
        await handleAvatarUpload(selectedAvatarFile);
      }

      // Update profile data
      await userClient.user.updateProfile({
        name: data.name,
        bio: data.bio || null,
      });

      toast.success('Profile updated successfully', {
        description: 'Your changes have been saved',
      });
    } catch (error) {
      // Revert optimistic update on error
      userProfile = previousProfile;
      formData = previousFormData;

      toast.error('Failed to update profile', {
        description: error instanceof Error ? error.message : 'Please try again',
        action: {
          label: 'Retry',
          onClick: () => handleSave(data),
        },
      });
    } finally {
      submitting = false;
    }
  }

  async function handleChangePassword(data: ChangePasswordFormData) {
    changingPassword = true;
    passwordError = '';

    try {
      await userClient.user.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      });

      toast.success('Password changed successfully', {
        description: 'Your password has been updated and you have been signed out from other devices',
      });

      // Close dialog on success
      showChangePasswordDialog = false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';

      // Set error to display in form
      passwordError = errorMessage;

      toast.error('Failed to change password', {
        description: errorMessage,
        action: {
          label: 'Retry',
          onClick: () => handleChangePassword(data),
        },
      });
    } finally {
      changingPassword = false;
    }
  }

  function openChangePasswordDialog() {
    passwordError = '';
    showChangePasswordDialog = true;
  }

  async function loadSessions() {
    sessionsLoading = true;
    try {
      const result = await userClient.user.getSessions();
      sessions = (result as SessionData[]) || [];
    } catch (error) {
      toast.error('Failed to load sessions', {
        description: error instanceof Error ? error.message : 'Please try again later',
        action: {
          label: 'Retry',
          onClick: () => loadSessions(),
        },
      });
    } finally {
      sessionsLoading = false;
    }
  }

  async function handleRevokeSession(token: string) {
    const sessionToRevoke = sessions.find((s) => s.token === token);

    if (!sessionToRevoke) {
      return;
    }

    // Optimistic update: Remove session from list
    const previousSessions = [...sessions];
    sessions = sessions.filter((s) => s.token !== token);

    try {
      await userClient.user.revokeSession({ token });

      toast.success('Session revoked successfully', {
        description: 'The session has been terminated',
      });
    } catch (error) {
      // Revert optimistic update on error
      sessions = previousSessions;

      toast.error('Failed to revoke session', {
        description: error instanceof Error ? error.message : 'Please try again',
        action: {
          label: 'Retry',
          onClick: () => handleRevokeSession(token),
        },
      });
    }
  }

  async function handleDeleteAccount() {
    deletingAccount = true;

    try {
      await userClient.user.deleteAccount();

      toast.success('Account deleted successfully', {
        description: 'Your account has been permanently deleted',
      });

      // Redirect to home page after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      toast.error('Failed to delete account', {
        description: error instanceof Error ? error.message : 'Please try again',
        action: {
          label: 'Retry',
          onClick: () => handleDeleteAccount(),
        },
      });
    } finally {
      deletingAccount = false;
      showDeleteAccountDialog = false;
    }
  }

  function openDeleteAccountDialog() {
    showDeleteAccountDialog = true;
  }
</script>

<header class="bg-background sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b p-4">
  <SecondarySidebarTrigger class="-ms-1" />
  <Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
  <Breadcrumb.Root>
    <Breadcrumb.List>
      <Breadcrumb.Item>
        <Breadcrumb.Link href="/app/settings">Settings</Breadcrumb.Link>
      </Breadcrumb.Item>
      <Breadcrumb.Separator />
      <Breadcrumb.Item>
        <Breadcrumb.Page>Account</Breadcrumb.Page>
      </Breadcrumb.Item>
    </Breadcrumb.List>
  </Breadcrumb.Root>
</header>

<div class="flex h-[calc(100vh-61px)]">
  <main class="flex-1 overflow-auto p-6">
    <div class="mx-auto max-w-4xl">
      <div class="mb-8">
        <h1 class="text-foreground mb-2 text-3xl font-bold">Account</h1>
        <p class="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <!-- Profile Section -->
      <section class="mb-8">
        <div class="rounded-lg border p-6">
          <div class="mb-4 flex items-center gap-4">
            <AvatarUpload
              currentAvatar={avatarPreview || userProfile?.image || $page.data?.user?.image}
              userName={formData.name || $page.data?.user?.name || 'User'}
              disabled={submitting || uploadingAvatar}
              onfileselect={handleAvatarFileSelect}
            />
            <div>
              <h2 class="text-foreground text-xl font-semibold">
                {$page.data?.user?.name || 'User'}
              </h2>
              <p class="text-muted-foreground flex items-center gap-1 text-sm">
                <MailIcon class="size-4" />
                {$page.data?.user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Account Details Section -->
      <section class="mb-8">
        <h3 class="text-foreground mb-4 text-xl font-semibold">Account Details</h3>
        <Card>
          <CardContent class="p-6">
            {#if loading}
              <div class="flex items-center justify-center py-8">
                <div
                  class="border-primary border-t-transparent h-8 w-8 animate-spin rounded-full"
                  role="status"
                  aria-label="Loading"
                >
                  <span class="sr-only">Loading profile...</span>
                </div>
              </div>
            {:else}
              <div class="space-y-6">
                <!-- Editable Profile Form -->
                <div>
                  <ProfileForm
                    data={formData}
                    submitting={submitting}
                    onsubmit={handleSave}
                  />
                </div>

                <!-- Read-only Account Information -->
                <div class="space-y-4 border-t pt-6">
                  <div>
                    <label class="text-muted-foreground mb-1 block text-sm font-medium"
                      >Email Address</label
                    >
                    <div class="rounded-md border px-3 py-2 text-sm">
                      {$page.data?.user?.email || 'user@example.com'}
                    </div>
                  </div>
                  <div>
                    <label class="text-muted-foreground mb-1 block text-sm font-medium">Account ID</label>
                    <div class="rounded-md border px-3 py-2 font-mono text-sm">
                      {$page.data?.user?.id || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            {/if}
          </CardContent>
        </Card>
      </section>

      <!-- Security Section -->
      <section class="mb-8">
        <h3 class="text-foreground mb-4 text-xl font-semibold">Security</h3>
        <div class="rounded-lg border p-6">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-foreground text-base font-medium">Password</h4>
                <p class="text-muted-foreground text-sm">Change your password</p>
              </div>
              <button
                onclick={openChangePasswordDialog}
                class="border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Active Sessions Section -->
      <section class="mb-8">
        <SessionsList
          {sessions}
          loading={sessionsLoading}
          onrevoke={handleRevokeSession}
          onrefresh={loadSessions}
        />
      </section>

      <!-- Danger Zone Section -->
      <section>
        <h3 class="text-destructive mb-4 text-xl font-semibold">Danger Zone</h3>
        <div class="border-destructive/50 rounded-lg border p-6">
          <div class="space-y-4">
            <div>
              <h4 class="text-foreground text-base font-medium">Delete Account</h4>
              <p class="text-muted-foreground mb-4 text-sm">
                Permanently delete your account and all associated data. This action cannot be
                undone.
              </p>
              <button
                onclick={openDeleteAccountDialog}
                class="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-ring inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
</div>

<!-- Change Password Dialog -->
<Dialog.Root bind:open={showChangePasswordDialog} onOpenChange={(open) => showChangePasswordDialog = open}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>Change Password</Dialog.Title>
      <Dialog.Description>
        Enter your current password and choose a new secure password
      </Dialog.Description>
    </Dialog.Header>

    <ChangePasswordForm
      submitting={changingPassword}
      error={passwordError}
      onsubmit={handleChangePassword}
      oncancel={() => showChangePasswordDialog = false}
    />
  </Dialog.Content>
</Dialog.Root>

<!-- Delete Account Dialog -->
<Dialog.Root bind:open={showDeleteAccountDialog} onOpenChange={(open) => showDeleteAccountDialog = open}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>Delete Account</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete your account? This action cannot be undone.
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 py-4">
      <div class="rounded-md bg-destructive/10 p-4 border border-destructive/20">
        <p class="text-destructive text-sm font-medium">Warning:</p>
        <ul class="text-destructive mt-2 space-y-1 text-sm">
          <li>• All your data will be permanently deleted</li>
          <li>• Your chats, messages, and settings will be lost</li>
          <li>• This action cannot be undone</li>
        </ul>
      </div>

      <div class="flex justify-end gap-2">
        <button
          onclick={() => showDeleteAccountDialog = false}
          disabled={deletingAccount}
          class="border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onclick={handleDeleteAccount}
          disabled={deletingAccount}
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-ring inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {#if deletingAccount}
            <div
              class="border-destructive-foreground border-t-transparent mr-2 h-4 w-4 animate-spin rounded-full"
              role="status"
              aria-label="Deleting account"
            >
              <span class="sr-only">Deleting...</span>
            </div>
            Deleting...
          {:else}
            Delete Account
          {/if}
        </button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
