import React, {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { View } from "react-native";

import type {
  DatePickerContextValue,
  DatePickerRootProps,
  DateValue,
  TriggerRect,
} from "./types/date-picker";

export const DatePickerContext = createContext<DatePickerContextValue | null>(
  null,
);

const CURRENT_YEAR = new Date().getFullYear();
export const DEFAULT_MIN_YEAR = CURRENT_YEAR - 100;
export const DEFAULT_MAX_YEAR = CURRENT_YEAR + 50;

export function DatePickerRoot({
  children,
  defaultValue,
  defaultOpen = false,
  maxYear = DEFAULT_MAX_YEAR,
  minYear = DEFAULT_MIN_YEAR,
  onChange,
  onOpenChange,
  open: openProp,
  value,
}: DatePickerRootProps) {
  const today = useMemo(() => new Date(), []);
  const [internalValue, setInternalValue] = useState<DateValue>(
    () =>
      defaultValue ?? {
        day: today.getDate(),
        month: today.getMonth(),
        year: today.getFullYear(),
      },
  );
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [triggerRect, setTriggerRect] = useState<TriggerRect | null>(null);
  const triggerRef = useRef<View | null>(null);

  const currentValue = value ?? internalValue;
  const open = openProp ?? internalOpen;

  const setValue = useCallback(
    (next: DateValue) => {
      if (value === undefined) setInternalValue(next);
      onChange?.(next);
    },
    [onChange, value],
  );

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange, openProp],
  );

  const measureTrigger = useCallback(
    (onMeasured?: (rect: TriggerRect) => void) => {
      const node = triggerRef.current;
      if (!node) return;

      node.measureInWindow((x, y, width, height) => {
        const rect = { x, y, width, height };
        setTriggerRect(rect);
        onMeasured?.(rect);
      });
    },
    [],
  );

  const toggle = useCallback(() => {
    if (open) {
      setOpen(false);
      return;
    }

    const node = triggerRef.current;
    if (!node) {
      setOpen(true);
      return;
    }

    measureTrigger(() => {
      setOpen(true);
    });
  }, [measureTrigger, open, setOpen]);

  const valueContext = useMemo<DatePickerContextValue>(
    () => ({
      maxYear,
      measureTrigger,
      minYear,
      open,
      setOpen,
      setValue,
      toggle,
      triggerRect,
      triggerRef,
      value: currentValue,
    }),
    [
      currentValue,
      maxYear,
      measureTrigger,
      minYear,
      open,
      setOpen,
      setValue,
      toggle,
      triggerRect,
    ],
  );

  return (
    <DatePickerContext.Provider value={valueContext}>
      {children}
    </DatePickerContext.Provider>
  );
}

export type {
  DatePickerContextValue,
  DatePickerRootProps,
  DateValue,
  TriggerRect,
} from "./types/date-picker";
