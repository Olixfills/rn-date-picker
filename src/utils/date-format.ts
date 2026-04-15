import { MONTH_SHORT } from "../constants";
import type { DateValue } from "../types/date-picker";

export function formatTriggerLabel(value: DateValue) {
  return `${value.day} ${MONTH_SHORT[value.month]} ${value.year}`;
}
