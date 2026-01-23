<script lang="ts">
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import MonitorIcon from '@lucide/svelte/icons/monitor';
  import MapPinIcon from '@lucide/svelte/icons/map-pin';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

  /**
   * Session data structure (matches backend UserSession)
   */
  export interface SessionData {
    id: string;
    token: string;
    expiresAt: Date | string;
    createdAt: Date | string;
    updatedAt: Date | string;
    ipAddress: string | null;
    userAgent: string | null;
    isCurrent: boolean;
  }

  /**
   * Props for the session card component
   */
  interface Props {
    /** Session data to display */
    session: SessionData;
    /** Callback when revoke is clicked */
    onrevoke?: (token: string) => void;
  }

  let { session, onrevoke }: Props = $props();

  /**
   * Parse user agent to extract browser/device info
   */
  function parseUserAgent(userAgent: string | null): { browser: string; os: string } {
    if (!userAgent) {
      return { browser: 'Unknown Browser', os: 'Unknown Device' };
    }

    // Simple browser detection
    let browser = 'Unknown Browser';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser = 'Chrome';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'Safari';
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
    } else if (userAgent.includes('Edg')) {
      browser = 'Edge';
    }

    // Simple OS detection
    let os = 'Unknown Device';
    if (userAgent.includes('Windows')) {
      os = 'Windows';
    } else if (userAgent.includes('Mac OS')) {
      os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
    } else if (
      userAgent.includes('iOS') ||
      userAgent.includes('iPhone') ||
      userAgent.includes('iPad')
    ) {
      os = 'iOS';
    }

    return { browser, os };
  }

  /**
   * Format date for display
   */
  function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format IP address for display (mask for privacy)
   */
  function formatIPAddress(ip: string | null): string {
    if (!ip) return 'Unknown Location';
    // Simple IPv4 masking (show first two octets)
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
    // For IPv6 or other formats, just show truncated
    return ip.length > 10 ? `${ip.substring(0, 10)}...` : ip;
  }

  /**
   * Calculate session status
   */
  function getSessionStatus(): { label: string; variant: 'default' | 'warning' } {
    const now = new Date();
    const expiresAt =
      typeof session.expiresAt === 'string' ? new Date(session.expiresAt) : session.expiresAt;
    const daysUntilExpiry = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (session.isCurrent) {
      return { label: 'Current Session', variant: 'default' };
    } else if (daysUntilExpiry < 1) {
      return { label: 'Expires Soon', variant: 'warning' };
    } else if (daysUntilExpiry < 7) {
      return {
        label: `Expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`,
        variant: 'default',
      };
    } else {
      return { label: 'Active', variant: 'default' };
    }
  }

  const deviceInfo = $derived(parseUserAgent(session.userAgent));
  const sessionStatus = $derived(getSessionStatus());
</script>

<Card class={session.isCurrent ? 'border-primary/50' : ''}>
  <CardHeader>
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-2">
        <div
          class="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full"
        >
          <MonitorIcon class="size-4" />
        </div>
        <div>
          <CardTitle class="text-base">
            {deviceInfo.browser}
          </CardTitle>
          <CardDescription class="text-xs">
            {deviceInfo.os}
            {#if session.isCurrent}
              <span class="text-primary ml-2 flex items-center gap-1 text-xs font-medium">
                <ShieldCheckIcon class="size-3" />
                Current
              </span>
            {/if}
          </CardDescription>
        </div>
      </div>
      {#if onrevoke && !session.isCurrent}
        <Button
          size="sm"
          variant="ghost"
          class="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
          onclick={() => onrevoke?.(session.token)}
        >
          <Trash2Icon class="size-4" />
        </Button>
      {/if}
    </div>
  </CardHeader>
  <CardContent>
    <div class="space-y-2 text-xs">
      <div class="text-muted-foreground flex items-center gap-2">
        <MapPinIcon class="size-3" />
        <span>{formatIPAddress(session.ipAddress)}</span>
      </div>
      <div class="text-muted-foreground flex items-center gap-2">
        <ClockIcon class="size-3" />
        <span>Last active: {formatDate(session.updatedAt)}</span>
      </div>
      <div class="text-muted-foreground">
        Expires: {formatDate(session.expiresAt)}
      </div>
    </div>
  </CardContent>
</Card>
