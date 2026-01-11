<script lang="ts">
  interface Props {
    title?: string;
    description?: string;
  }

  let { title, description }: Props = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
  <div class="w-full max-w-md space-y-8">
    {#if title}
      <div class="text-center">
        <h1 class="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {#if description}
          <p class="mt-2 text-sm text-muted-foreground">{description}</p>
        {/if}
      </div>
    {/if}

    <slot />
  </div>
</div>
