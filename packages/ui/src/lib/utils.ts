import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { tv, type VariantProps } from 'tailwind-variants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type { VariantProps };
export { tv };

// Type utilities for shadcn-svelte components
export type WithElementRef<T extends Record<string, unknown>> = T & {
  ref?: HTMLElement | null;
};

export type WithoutChildrenOrChild<T> = Omit<T, 'children' | 'child'>;

export type WithoutChild<T> = Omit<T, 'child'>;

export type TVReturnType<T extends ReturnType<typeof tv>> = T;
