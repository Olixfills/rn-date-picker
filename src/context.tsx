import React, {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { View } from "react-native";

import { clampDateTime } from "./utils/calendar";
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
  minDate,
  maxDate,
  minTime,
  maxTime,
  mode = "date",
  is24Hour = false,
  onChange,
  onOpenChange,
  open: openProp,
  value,
}: DatePickerRootProps) {
  const today = useMemo(() => new Date(), []);
  const [internalValue, setInternalValue] = useState<DateValue>(() => {
    return {
      day: defaultValue?.day ?? today.getDate(),
      month: defaultValue?.month ?? today.getMonth(),
      year: defaultValue?.year ?? today.getFullYear(),
      hour: defaultValue?.hour ?? today.getHours(),
      minute: defaultValue?.minute ?? today.getMinutes(),
    };
  });
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [triggerRect, setTriggerRect] = useState<TriggerRect | null>(null);
  const triggerRef = useRef<View | null>(null);

  const currentValue = useMemo(() => {
    const val = value ?? internalValue;
    return {
      day: val.day,
      month: val.month,
      year: val.year,
      hour: val.hour ?? today.getHours(),
      minute: val.minute ?? today.getMinutes(),
    };
  }, [value, internalValue, today]);
  const open = openProp ?? internalOpen;

  const setValue = useCallback(
    (next: DateValue) => {
      const clamped = clampDateTime(next, minDate, maxDate, minTime, maxTime);
      if (value === undefined) setInternalValue(clamped);
      onChange?.(clamped);
    },
    [onChange, value, minDate, maxDate, minTime, maxTime],
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

    setOpen(true);

    requestAnimationFrame(() => {
      measureTrigger();
    });
  }, [measureTrigger, open, setOpen]);

  const valueContext = useMemo<DatePickerContextValue>(
    () => ({
      maxYear,
      measureTrigger,
      minYear,
      minDate,
      maxDate,
      minTime,
      maxTime,
      mode,
      is24Hour,
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
      minDate,
      maxDate,
      minTime,
      maxTime,
      mode,
      is24Hour,
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
