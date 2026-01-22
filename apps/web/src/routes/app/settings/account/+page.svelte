<script lang="ts">
  import { onMount } from 'svelte';
  import { orpc } from '$lib/orpc';
  import SecondarySidebarTrigger from '$lib/components/secondary-sidebar-trigger.svelte';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
  import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
  import MailIcon from '@lucide/svelte/icons/mail';
  import { page } from '$app/stores';
  import { ProfileForm, type ProfileFormData } from '$lib/components/settings/profile';
  import { toast } from 'svelte-sonner';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';

  // Type assertion for user router (temporary workaround until types are regenerated)
  const userClient = orpc as any & {
    user: {
      getProfile: () => Promise<any>;
      updateProfile: (input: any) => Promise<any>;
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

  // Form data
  let formData = $state<ProfileFormData>({
    name: '',
    bio: '',
  });

  onMount(async () => {
    await loadProfile();
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

  async function handleSave(data: ProfileFormData) {
    submitting = true;

    // Store previous state for rollback
    const previousProfile = userProfile ? { ...userProfile } : null;
    const previousFormData = { ...formData };

    // Optimistic update
    if (userProfile) {
      userProfile = {
        ...userProfile,
        name: data.name,
        bio: data.bio || null,
        updatedAt: new Date(),
      };
    }
    formData = { ...data };

    try {
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
            <div
              class="bg-primary text-primary-foreground flex aspect-square size-16 items-center justify-center rounded-full text-2xl font-semibold"
            >
              {$page.data?.user?.name?.charAt(0) || 'U'}
            </div>
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
                class="border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
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
