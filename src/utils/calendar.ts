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
