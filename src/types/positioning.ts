import type { TriggerRect } from "./date-picker";

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

interface ComputePositionInput {
  align: Align;
  alignOffset: number;
  avoidCollisions: boolean;
  collisionPadding: number;
  contentSize: { width: number; height: number };
  side: Side;
  sideOffset: number;
  triggerRect: TriggerRect;
  windowSize: { width: number; height: number };
}

interface ComputedPosition {
  align: Align;
  side: Side;
  x: number;
  y: number;
}

export type { Align, ComputedPosition, ComputePositionInput, Side };
