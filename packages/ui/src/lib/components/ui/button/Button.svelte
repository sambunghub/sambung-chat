<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  const buttonVariants = tv({
    base: 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  });

  export type Variant = VariantProps<typeof buttonVariants>['variant'];
  export type Size = VariantProps<typeof buttonVariants>['size'];
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  type Variant = import('./Button.svelte').Variant;
  type Size = import('./Button.svelte').Size;

  type $$Props = {
    class?: string;
    variant?: Variant;
    size?: Size;
    type?: 'button' | 'submit' | 'reset';
    href?: string;
    disabled?: boolean;
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
  };

  export let className: $$Props['class'] = undefined;
  export let variant: $$Props['variant'] = undefined;
  export let size: $$Props['size'] = undefined;
  export let type: $$Props['type'] = 'button';
  export let href: $$Props['href'] = undefined;
  export let disabled: $$Props['disabled'] = undefined;
  export let onclick: $$Props['onclick'] = undefined;
  export let children: $$Props['children'];

  const variantMap: Record<NonNullable<Variant>, string> = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
  };

  const sizeMap: Record<NonNullable<Size>, string> = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10',
  };

  const baseClasses =
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const getVariantClasses = (
    variant: Variant | undefined,
    size: Size | undefined,
    className: string | undefined
  ) => {
    const variantClass = variant ? variantMap[variant] : variantMap.default;
    const sizeClass = size ? sizeMap[size] : sizeMap.default;
    return cn(baseClasses, variantClass, sizeClass, className);
  };

  $: classes = getVariantClasses(variant, size, className);
</script>

<svelte:element
  this={href ? 'a' : 'button'}
  class={classes}
  {href}
  {type}
  {disabled}
  {onclick}
  {...$$restProps}
>
  {@render children()}
</svelte:element>
