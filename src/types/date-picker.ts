import type { ReactNode, RefObject } from "react";
import type { StyleProp, View, ViewStyle } from "react-native";
import type { Align, Side } from "./positioning";

interface DateValue {
  day: number;
  month: number;
  year: number;
}

interface TriggerRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DatePickerContextValue {
  value: DateValue;
  setValue: (next: DateValue) => void;
  open: boolean;
  setOpen: (next: boolean) => void;
  toggle: () => void;
  minYear: number;
  maxYear: number;
  triggerRef: RefObject<View | null>;
  triggerRect: TriggerRect | null;
  measureTrigger: (onMeasured?: (rect: TriggerRect) => void) => void;
}

interface DatePickerRootProps {
  children: ReactNode;
  defaultValue?: DateValue;
  defaultOpen?: boolean;
  maxYear?: number;
  minYear?: number;
  onChange?: (value: DateValue) => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  value?: DateValue;
}

interface DatePickerProps {
  initialMonth?: number;
  initialYear?: number;
  onDateChange?: (month: number, year: number) => void;
}

interface MonthPageProps {
  fontFamily?: string;
  month: number;
  onSelect: (day: number, month: number, year: number) => void;
  pageWidth: number;
  selectedDay: number | null;
  year: number;
}

interface DatePickerTriggerProps {
  children?: ReactNode;
  hitSlop?: number;
  style?: StyleProp<ViewStyle>;
}

interface DatePickerContentProps {
  align?: Align;
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionPadding?: number;
  side?: Side;
  sideOffset?: number;
}

type DatePickerDropdownProps = Pick<
  DatePickerRootProps,
  | "defaultOpen"
  | "defaultValue"
  | "maxYear"
  | "minYear"
  | "onChange"
  | "onOpenChange"
  | "open"
  | "value"
> & {
  align?: Align;
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionPadding?: number;
  side?: Side;
  sideOffset?: number;
};

type DatePickerContentMode = "calendar" | "wheel";

export type {
  DatePickerContentMode,
  DatePickerContentProps,
  DatePickerContextValue,
  DatePickerDropdownProps,
  DatePickerProps,
  DatePickerRootProps,
  DatePickerTriggerProps,
  DateValue,
  MonthPageProps,
  TriggerRect,
};
