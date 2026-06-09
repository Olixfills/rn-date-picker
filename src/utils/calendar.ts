import { CELL_HEIGHT, WEEKDAY_HEIGHT } from "../constants";

export function buildGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const grid: (number | null)[] = [];

  for (let i = 0; i < totalCells; i++) {
    const day = i - firstDay + 1;
    grid.push(day >= 1 && day <= daysInMonth ? day : null);
  }

  return grid;
}

export function clampIndex(index: number, max: number): number {
  return Math.max(0, Math.min(index, max - 1));
}

export function computeStageHeight(rows: number): number {
  return WEEKDAY_HEIGHT + rows * CELL_HEIGHT;
}

export function indexToMonth(
  index: number,
  minYear: number,
): { month: number; year: number } {
  return {
    month: index % 12,
    year: minYear + Math.floor(index / 12),
  };
}

export function monthToIndex(
  year: number,
  month: number,
  minYear: number,
): number {
  return (year - minYear) * 12 + month;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function firstWeekday(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

import type { DateValue } from "../types/date-picker";

export function clampDateTime(
  value: DateValue,
  minDate?: DateValue,
  maxDate?: DateValue,
  minTime?: { hour: number; minute: number },
  maxTime?: { hour: number; minute: number }
): DateValue {
  let { day, month, year, hour = 10, minute = 0 } = value;

  // 1. Compare Date parts
  if (minDate) {
    const valueDate = new Date(year, month, day);
    const minD = new Date(minDate.year, minDate.month, minDate.day);
    if (valueDate < minD) {
      day = minDate.day;
      month = minDate.month;
      year = minDate.year;
    }
  }

  if (maxDate) {
    const valueDate = new Date(year, month, day);
    const maxD = new Date(maxDate.year, maxDate.month, maxDate.day);
    if (valueDate > maxD) {
      day = maxDate.day;
      month = maxDate.month;
      year = maxDate.year;
    }
  }

  // 2. Validate Time boundaries
  // Check if we are at exactly minDate
  if (minDate && minTime && year === minDate.year && month === minDate.month && day === minDate.day) {
    const minutesVal = hour * 60 + minute;
    const minMinutes = minTime.hour * 60 + minTime.minute;
    if (minutesVal < minMinutes) {
      hour = minTime.hour;
      minute = minTime.minute;
    }
  } else if (!minDate && minTime) {
    const minutesVal = hour * 60 + minute;
    const minMinutes = minTime.hour * 60 + minTime.minute;
    if (minutesVal < minMinutes) {
      hour = minTime.hour;
      minute = minTime.minute;
    }
  }

  // Check if we are at exactly maxDate
  if (maxDate && maxTime && year === maxDate.year && month === maxDate.month && day === maxDate.day) {
    const minutesVal = hour * 60 + minute;
    const maxMinutes = maxTime.hour * 60 + maxTime.minute;
    if (minutesVal > maxMinutes) {
      hour = maxTime.hour;
      minute = maxTime.minute;
    }
  } else if (!maxDate && maxTime) {
    const minutesVal = hour * 60 + minute;
    const maxMinutes = maxTime.hour * 60 + maxTime.minute;
    if (minutesVal > maxMinutes) {
      hour = maxTime.hour;
      minute = maxTime.minute;
    }
  }

  return { day, month, year, hour, minute };
}
