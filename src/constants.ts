import { Platform } from "react-native";

const ITEM_HEIGHT = 20;
const VISIBLE_ITEMS = 11;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const HALF_COUNT = Math.floor(VISIBLE_ITEMS / 2);
const PANEL_WIDTH = 372;
const PANEL_PADDING_H = 20;
const PANEL_PADDING_TOP = 18;
const PANEL_PADDING_BOTTOM = 6;
const PANEL_INNER_WIDTH = PANEL_WIDTH - PANEL_PADDING_H * 2;
const WEEKDAY_HEIGHT = 32;
const CELL_HEIGHT = 44;
const HEADER_HEIGHT = 42;
const STAGE_GAP = 12;
const DROPDOWN_WHEEL_VISIBLE_COUNT = 7;
const MAX_CALENDAR_ROWS = 6;
const MAX_DISTRIBUTED_ROW_GAP = 18;
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const CALENDAR_DECELERATION_RATE = Platform.select({
  android: 0.985,
  default: 0.998,
});

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const MONTH_LOOP_COUNT = 10;
const MONTH_LOOP_MIDDLE = Math.floor(MONTH_LOOP_COUNT / 2);
const MONTHS_LOOPED = Array.from(
  { length: MONTH_LOOP_COUNT },
  () => MONTHS,
).flat();
const START_YEAR = 2000;
const END_YEAR = 2050;
const YEARS = Array.from(
  { length: END_YEAR - START_YEAR + 1 },
  (_, i) => `${START_YEAR + i}`,
);

export {
  CALENDAR_DECELERATION_RATE,
  CELL_HEIGHT,
  DROPDOWN_WHEEL_VISIBLE_COUNT,
  END_YEAR,
  HALF_COUNT,
  HEADER_HEIGHT,
  ITEM_HEIGHT,
  MAX_CALENDAR_ROWS,
  MAX_DISTRIBUTED_ROW_GAP,
  MONTH_LOOP_COUNT,
  MONTH_LOOP_MIDDLE,
  MONTH_SHORT,
  MONTHS,
  MONTHS_LOOPED,
  PANEL_INNER_WIDTH,
  PANEL_PADDING_BOTTOM,
  PANEL_PADDING_H,
  PANEL_PADDING_TOP,
  PANEL_WIDTH,
  PICKER_HEIGHT,
  STAGE_GAP,
  START_YEAR,
  VISIBLE_ITEMS,
  WEEKDAY_HEIGHT,
  WEEKDAYS,
  YEARS,
};
