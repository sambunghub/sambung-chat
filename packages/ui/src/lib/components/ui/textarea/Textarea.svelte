<script lang="ts">
  import { cn } from '$lib/utils';

  type $$Props = {
    class?: string;
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    name?: string;
    id?: string;
    rows?: number;
    cols?: number;
    minlength?: number;
    maxlength?: number;
    wrap?: 'soft' | 'hard';
    oninput?: (event: Event & { currentTarget: HTMLTextAreaElement }) => void;
    onchange?: (event: Event & { currentTarget: HTMLTextAreaElement }) => void;
    onfocus?: (event: FocusEvent) => void;
    onblur?: (event: FocusEvent) => void;
  };

  export let className: $$Props['class'] = undefined;
  export let value: $$Props['value'] = undefined;
  export let placeholder: $$Props['placeholder'] = undefined;
  export let disabled: $$Props['disabled'] = undefined;
  export let readonly: $$Props['readonly'] = undefined;
  export let required: $$Props['required'] = undefined;
  export let name: $$Props['name'] = undefined;
  export let id: $$Props['id'] = undefined;
  export let rows: $$Props['rows'] = undefined;
  export let cols: $$Props['cols'] = undefined;
  export let minlength: $$Props['minlength'] = undefined;
  export let maxlength: $$Props['maxlength'] = undefined;
  export let wrap: $$Props['wrap'] = undefined;
  export let oninput: $$Props['oninput'] = undefined;
  export let onchange: $$Props['onchange'] = undefined;
  export let onfocus: $$Props['onfocus'] = undefined;
  export let onblur: $$Props['onblur'] = undefined;
</script>

<textarea
  {value}
  {placeholder}
  {disabled}
  {readonly}
  {required}
  {name}
  {id}
  {rows}
  {cols}
  {minlength}
  {maxlength}
  {wrap}
  class={cn(
    'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  {oninput}
  {onchange}
  {onfocus}
  {onblur}
  {...$$restProps}
></textarea>
