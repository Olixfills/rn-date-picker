import React, { memo } from "react";

import { DatePickerContent } from "./components/date-picker-content";
import { DatePickerTrigger } from "./components/date-picker-trigger";
import { DatePickerRoot } from "./context";
import type { DatePickerDropdownProps } from "./types/date-picker";

function DatePickerDropdownBase({
  align,
  alignOffset,
  avoidCollisions,
  collisionPadding,
  defaultOpen,
  defaultValue,
  maxYear,
  minYear,
  onChange,
  onOpenChange,
  open,
  side,
  sideOffset,
  value,
}: DatePickerDropdownProps) {
  return (
    <DatePickerRoot
      defaultOpen={defaultOpen}
      defaultValue={defaultValue}
      maxYear={maxYear}
      minYear={minYear}
      onChange={onChange}
      onOpenChange={onOpenChange}
      open={open}
      value={value}
    >
      <DatePickerTrigger />
      <DatePickerContent
        align={align}
        alignOffset={alignOffset}
        avoidCollisions={avoidCollisions}
        collisionPadding={collisionPadding}
        side={side}
        sideOffset={sideOffset}
      />
    </DatePickerRoot>
  );
}

export const DatePickerDropdown = Object.assign(memo(DatePickerDropdownBase), {
  Content: DatePickerContent,
  Root: DatePickerRoot,
  Trigger: DatePickerTrigger,
});

export type {
  DatePickerContentProps,
  DatePickerTriggerProps,
  DateValue,
} from "./types/date-picker";
