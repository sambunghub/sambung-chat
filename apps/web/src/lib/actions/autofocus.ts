import type { Action } from 'svelte/action';

/**
 * Svelte action that automatically focuses an element when mounted.
 * Optionally accepts a condition to control when autofocus should occur.
 *
 * @example
 * ```svelte
 * <input use:autofocus />
 * <input use:autofocus={shouldFocus} />
 * ```
 */
export const autofocus: Action<
  HTMLElement,
  boolean | undefined | ((element: HTMLElement) => void)
> = (element, config = true) => {
  // If config is a function, call it with the element
  if (typeof config === 'function') {
    config(element);
    return {};
  }

  // If config is true or undefined, focus the element
  if (config !== false) {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      element.focus();
    });
  }

  return {};
};
