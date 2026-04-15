import type { DateValue } from "@/context";

function toDateValue(date: Date): DateValue {
  return {
    day: date.getDate(),
    month: date.getMonth(),
    year: date.getFullYear(),
  };
}

export { toDateValue };
