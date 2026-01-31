<script lang="ts">
  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();
</script>

<div class={className}>
  <span class="typing-dots inline-flex items-center gap-1" aria-label="AI is typing">
    <span></span>
    <span></span>
    <span></span>
  </span>
</div>
