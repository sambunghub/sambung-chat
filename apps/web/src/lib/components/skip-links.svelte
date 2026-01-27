<script lang="ts">
  /**
   * Skip Links Component
   *
   * Provides skip navigation links for keyboard users to bypass repetitive content.
   * Addresses WCAG 2.4.1 (Bypass Blocks) - Level A
   *
   * These links are invisible until focused, making them available only to keyboard users.
   *
   * Features:
   * - Skip to main content (bypasses navigation)
   * - Skip to navigation (bypasses header/main content)
   */
</script>

<div class="sr-only">
  <nav aria-label="Skip navigation">
    <ul class="flex flex-col gap-2">
      <li>
        <a
          href="#main-content"
          class="focus-visible:bg-background focus-visible:text-foreground bg-primary text-primary-foreground focus-visible:ring-ring absolute top-4 left-4 z-[100] rounded-md px-4 py-2 text-sm font-medium opacity-0 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Skip to main content
        </a>
      </li>
      <li>
        <a
          href="#navigation"
          class="focus-visible:bg-background focus-visible:text-foreground bg-primary text-primary-foreground focus-visible:ring-ring absolute top-16 left-4 z-[100] rounded-md px-4 py-2 text-sm font-medium opacity-0 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Skip to navigation
        </a>
      </li>
    </ul>
  </nav>
</div>

<style>
  /**
	 * Screen reader only class - hides content visually but keeps it accessible
	 * Works with the focus-visible classes to show links when keyboard focused
	 */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
