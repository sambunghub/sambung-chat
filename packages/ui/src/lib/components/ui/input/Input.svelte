<script lang="ts">
  import { cn } from '$lib/utils';

  type $$Props = {
    class?: string;
    type?: 'text' | 'password' | 'email' | 'number' | 'url' | 'search' | 'tel' | 'date' | 'time';
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    name?: string;
    id?: string;
    min?: number | string;
    max?: number | string;
    step?: number | string;
    pattern?: string;
    minlength?: number;
    maxlength?: number;
    oninput?: (event: Event & { currentTarget: HTMLInputElement }) => void;
    onchange?: (event: Event & { currentTarget: HTMLInputElement }) => void;
    onfocus?: (event: FocusEvent) => void;
    onblur?: (event: FocusEvent) => void;
    onkeydown?: (event: KeyboardEvent) => void;
    onkeyup?: (event: KeyboardEvent) => void;
  };

  export let className: $$Props['class'] = undefined;
  export let type: $$Props['type'] = 'text';
  export let value: $$Props['value'] = undefined;
  export let placeholder: $$Props['placeholder'] = undefined;
  export let disabled: $$Props['disabled'] = undefined;
  export let readonly: $$Props['readonly'] = undefined;
  export let required: $$Props['required'] = undefined;
  export let name: $$Props['name'] = undefined;
  export let id: $$Props['id'] = undefined;
  export let min: $$Props['min'] = undefined;
  export let max: $$Props['max'] = undefined;
  export let step: $$Props['step'] = undefined;
  export let pattern: $$Props['pattern'] = undefined;
  export let minlength: $$Props['minlength'] = undefined;
  export let maxlength: $$Props['maxlength'] = undefined;
  export let oninput: $$Props['oninput'] = undefined;
  export let onchange: $$Props['onchange'] = undefined;
  export let onfocus: $$Props['onfocus'] = undefined;
  export let onblur: $$Props['onblur'] = undefined;
  export let onkeydown: $$Props['onkeydown'] = undefined;
  export let onkeyup: $$Props['onkeyup'] = undefined;
</script>

<input
  {type}
  {value}
  {placeholder}
  {disabled}
  {readonly}
  {required}
  {name}
  {id}
  {min}
  {max}
  {step}
  {pattern}
  {minlength}
  {maxlength}
  class={cn(
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  {oninput}
  {onchange}
  {onfocus}
  {onblur}
  {onkeydown}
  {onkeyup}
  {...$$restProps}
/>
