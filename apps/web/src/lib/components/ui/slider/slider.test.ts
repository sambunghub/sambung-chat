export interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number[];
  disabled?: boolean;
  className?: HTMLAttributes<'class'>['class'];
}
