import { MONTHS, MONTH_SHORT } from "../constants";
import type { DateValue } from "../types/date-picker";

export function formatTriggerLabel(value: DateValue) {
  return `${value.day} ${MONTH_SHORT[value.month]} ${value.year}`;
}

export function formatDateTime(value: DateValue, formatString: string): string {
  const day = value.day;
  const month = value.month; // 0-indexed
  const year = value.year;
  const hour = value.hour ?? 10;
  const minute = value.minute ?? 0;

  const month1Based = month + 1;
  const yearStr = String(year);
  const yearShort = yearStr.slice(-2);

  const displayHour12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour >= 12 ? "PM" : "AM";

  const replacements: Record<string, string> = {
    YYYY: yearStr,
    YY: yearShort,
    MMMM: MONTHS[month] || "",
    MMM: MONTH_SHORT[month] || "",
    MM: String(month1Based).padStart(2, "0"),
    M: String(month1Based),
    DD: String(day).padStart(2, "0"),
    D: String(day),
    HH: String(hour).padStart(2, "0"),
    H: String(hour),
    hh: String(displayHour12).padStart(2, "0"),
    h: String(displayHour12),
    mm: String(minute).padStart(2, "0"),
    m: String(minute),
    A: ampm,
    a: ampm.toLowerCase(),
  };

  // Sort keys by length descending to match longer tokens first (e.g. YYYY before YY)
  const tokens = Object.keys(replacements).sort((a, b) => b.length - a.length);
  const regex = new RegExp(tokens.join("|"), "g");

  return formatString.replace(regex, (match) => replacements[match] ?? match);
}
