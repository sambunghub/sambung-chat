<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { Card, CardContent, CardHeader } from '$lib/components/ui/card/index.js';
  import ShieldIcon from '@lucide/svelte/icons/shield';
  import LogOutIcon from '@lucide/svelte/icons/log-out';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import SessionCard from './session-card.svelte';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import type { SessionData } from './session-card.svelte';

  /**
   * Props for the sessions list component
   */
  interface Props {
    /** Array of sessions to display */
    sessions: SessionData[];
    /** Whether the list is currently loading */
    loading?: boolean;
    /** Callback when revoke is clicked for a session */
    onrevoke?: (token: string) => void;
    /** Callback when refresh is clicked */
    onrefresh?: () => void;
  }

  let { sessions, loading = false, onrevoke, onrefresh }: Props = $props();

  // Ensure sessions is always an array and filter out undefined items
  const safeSessions = $derived((sessions || []).filter((s) => s !== undefined && s !== null));

  // Count sessions excluding current
  const otherSessionsCount = $derived(safeSessions.filter((s) => !s.isCurrent).length);
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-foreground text-lg font-semibold">Active Sessions</h3>
      <p class="text-muted-foreground text-sm">
        Manage your active sessions across devices
        {#if otherSessionsCount > 0}
          ( {otherSessionsCount} other session{otherSessionsCount > 1 ? 's' : ''} )
        {/if}
      </p>
    </div>
    {#if onrefresh}
      <Button size="sm" variant="outline" onclick={onrefresh}>
        <RefreshCwIcon class="mr-2 size-4" />
        Refresh
      </Button>
    {/if}
  </div>

  {#if loading}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each Array(3) as _, i (i)}
        <Card>
          <CardHeader class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Skeleton class="size-8 rounded-full" />
                <Skeleton class="h-5 w-32" />
              </div>
              <Skeleton class="size-8" />
            </div>
            <Skeleton class="h-4 w-24" />
          </CardHeader>
          <CardContent class="space-y-2">
            <Skeleton class="h-4 w-48" />
            <Skeleton class="h-4 w-48" />
          </CardContent>
        </Card>
      {/each}
    </div>
  {:else if safeSessions.length === 0}
    <Card>
      <CardContent class="py-12">
        <div class="text-center">
          <ShieldIcon class="text-muted-foreground mx-auto mb-4 size-12 opacity-50" />
          <h4 class="text-foreground mb-2 text-lg font-semibold">No active sessions</h4>
          <p class="text-muted-foreground text-sm">
            You don't have any active sessions. This shouldn't happen since you're logged in.
          </p>
        </div>
      </CardContent>
    </Card>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each safeSessions as session (session.id)}
        <SessionCard {session} {onrevoke} />
      {/each}
    </div>

    {#if safeSessions.length > 1}
      <Card class="border-muted-foreground/50 bg-muted/50">
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <LogOutIcon class="text-muted-foreground size-5" />
              <div>
                <p class="text-foreground text-sm font-medium">Sign out all other sessions</p>
                <p class="text-muted-foreground text-xs">
                  This will sign you out of all devices except this one
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onclick={() => {
                // Revoke all sessions except current
                safeSessions.forEach((s) => {
                  if (!s.isCurrent && onrevoke) {
                    onrevoke(s.token);
                  }
                });
              }}
            >
              Sign Out All Others
            </Button>
          </div>
        </CardContent>
      </Card>
    {/if}
  {/if}
</div>
