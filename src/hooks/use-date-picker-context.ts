import { useContext } from "react";

import { DatePickerContext } from "../context";
import type { DatePickerContextValue } from "../types/date-picker";

export function useDatePickerContext(): DatePickerContextValue {
  const context = useContext(DatePickerContext);

  if (!context) {
    throw new Error(
      "DatePicker components must be used within DatePickerDropdown.Root",
    );
  }

  return context;
}
