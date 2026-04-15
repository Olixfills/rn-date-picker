import type { DateValue } from "@/types/date-picker";

export type PlacementKey = "top" | "right" | "bottom" | "left";

export type PlacementTriggerProps = {
  accent: string;
  label: string;
  value: DateValue;
};
