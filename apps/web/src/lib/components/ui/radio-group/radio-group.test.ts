export interface RadioGroupProps {
  value?: string;
  disabled?: boolean;
  class?: HTMLAttributes<'class'>['class'];
  children?: import('svelte').Snippet;
}

export interface RadioGroupItemProps {
  value: string;
  disabled?: boolean;
  class?: HTMLAttributes<'class'>['class'];
  children?: import('svelte').Snippet;
}
