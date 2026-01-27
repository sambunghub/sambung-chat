<script lang="ts">
  const { children } = $props();
</script>

<!-- Centered layout for auth pages -->
<div
  id="main-content"
  tabindex={-1}
  class="bg-background flex min-h-screen items-center justify-center p-4"
>
  {@render children()}
</div>
