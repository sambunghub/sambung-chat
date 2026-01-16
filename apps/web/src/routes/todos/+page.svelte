<script lang="ts">
  import { orpc } from '../../lib/orpc';
  import { onMount } from 'svelte';

  let newTodoText = $state('');
  let todos = $state<Array<{ id: number; text: string; completed: boolean }>>([]);
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let isAdding = $state(false);

  // Load todos on mount
  onMount(async () => {
    await loadTodos();
  });

  async function loadTodos() {
    isLoading = true;
    error = null;
    try {
      todos = await orpc.todo.getAll();
    } catch (err) {
      error = (err as Error)?.message ?? 'Failed to load todos';
      console.error('Failed to load todos:', err);
    } finally {
      isLoading = false;
    }
  }

  async function handleAddTodo(event: SubmitEvent) {
    event.preventDefault();
    const text = newTodoText.trim();
    if (!text) return;

    isAdding = true;
    error = null;
    try {
      await orpc.todo.create({ text });
      newTodoText = '';
      await loadTodos(); // Refresh list
    } catch (err) {
      error = (err as Error)?.message ?? 'Failed to create todo';
      console.error('Failed to create todo:', err);
    } finally {
      isAdding = false;
    }
  }

  async function handleToggleTodo(id: number, completed: boolean) {
    try {
      await orpc.todo.toggle({ id, completed: !completed });
      await loadTodos(); // Refresh list
    } catch (err) {
      error = (err as Error)?.message ?? 'Failed to toggle todo';
      console.error('Failed to toggle todo:', err);
    }
  }

  async function handleDeleteTodo(id: number) {
    try {
      await orpc.todo.delete({ id });
      await loadTodos(); // Refresh list
    } catch (err) {
      error = (err as Error)?.message ?? 'Failed to delete todo';
      console.error('Failed to delete todo:', err);
    }
  }

  const canAdd = $derived(!isAdding && newTodoText.trim().length > 0);
  const hasTodos = $derived(todos.length > 0);
</script>

<div class="p-4">
  <h1 class="mb-4 text-xl">Todos (oRPC)</h1>

  <form onsubmit={handleAddTodo} class="mb-4 flex gap-2">
    <input
      type="text"
      bind:value={newTodoText}
      placeholder="New task..."
      disabled={isAdding}
      class=" flex-grow p-1"
    />
    <button
      type="submit"
      disabled={!canAdd}
      class="rounded bg-[hsl(var(--color-primary))] px-3 py-1 text-white hover:bg-[hsl(var(--color-primary-hover))] active:bg-[hsl(var(--color-primary-active))] disabled:opacity-50"
    >
      {#if isAdding}Adding...{:else}Add{/if}
    </button>
  </form>

  {#if error}
    <p class="text-red-500">{error}</p>
  {:else if isLoading}
    <p>Loading...</p>
  {:else if !hasTodos}
    <p>No todos yet.</p>
  {:else}
    <ul class="space-y-1">
      {#each todos as todo (todo.id)}
        <li class="flex items-center justify-between p-2">
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id={`todo-${todo.id}`}
              checked={todo.completed}
              onchange={() => handleToggleTodo(todo.id, todo.completed)}
            />
            <label for={`todo-${todo.id}`} class:line-through={todo.completed}>
              {todo.text}
            </label>
          </div>
          <button
            type="button"
            onclick={() => handleDeleteTodo(todo.id)}
            aria-label="Delete todo"
            class="px-1 text-red-500"
          >
            X
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
