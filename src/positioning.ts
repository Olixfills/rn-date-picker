import type {
  ComputedPosition,
  ComputePositionInput,
  Side,
} from "./types/positioning";

const OPPOSITE_SIDE: Record<Side, Side> = {
  bottom: "top",
  left: "right",
  right: "left",
  top: "bottom",
};

function clampCoordinate(
  value: number,
  size: number,
  total: number,
  padding: number,
) {
  const min = padding;
  const max = total - size - padding;

  if (max < min) {
    return Math.max((total - size) / 2, padding);
  }

  return Math.max(min, Math.min(value, max));
}

function availableSpace({
  collisionPadding,
  side,
  sideOffset,
  triggerRect,
  windowSize,
}: Pick<
  ComputePositionInput,
  "collisionPadding" | "sideOffset" | "triggerRect" | "windowSize"
> & { side: Side }) {
  switch (side) {
    case "bottom":
      return (
        windowSize.height -
        (triggerRect.y + triggerRect.height + sideOffset + collisionPadding)
      );
    case "top":
      return triggerRect.y - sideOffset - collisionPadding;
    case "right":
      return (
        windowSize.width -
        (triggerRect.x + triggerRect.width + sideOffset + collisionPadding)
      );
    case "left":
      return triggerRect.x - sideOffset - collisionPadding;
  }
}

function fitsOnSide({
  collisionPadding,
  contentSize,
  side,
  sideOffset,
  triggerRect,
  windowSize,
}: Pick<
  ComputePositionInput,
  | "collisionPadding"
  | "contentSize"
  | "sideOffset"
  | "triggerRect"
  | "windowSize"
> & { side: Side }) {
  switch (side) {
    case "bottom":
      return (
        triggerRect.y +
          triggerRect.height +
          sideOffset +
          contentSize.height +
          collisionPadding <=
        windowSize.height
      );
    case "top":
      return (
        triggerRect.y - sideOffset - contentSize.height - collisionPadding >= 0
      );
    case "right":
      return (
        triggerRect.x +
          triggerRect.width +
          sideOffset +
          contentSize.width +
          collisionPadding <=
        windowSize.width
      );
    case "left":
      return (
        triggerRect.x - sideOffset - contentSize.width - collisionPadding >= 0
      );
  }
}

export function computePosition({
  align,
  alignOffset,
  avoidCollisions,
  collisionPadding,
  contentSize,
  side: preferredSide,
  sideOffset,
  triggerRect,
  windowSize,
}: ComputePositionInput): ComputedPosition {
  let side = preferredSide;

  if (
    avoidCollisions &&
    !fitsOnSide({
      collisionPadding,
      contentSize,
      side,
      sideOffset,
      triggerRect,
      windowSize,
    })
  ) {
    const oppositeSide = OPPOSITE_SIDE[side];

    side =
      (
        fitsOnSide({
          collisionPadding,
          contentSize,
          side: oppositeSide,
          sideOffset,
          triggerRect,
          windowSize,
        })
      ) ?
        oppositeSide
      : (
        availableSpace({
          collisionPadding,
          side: oppositeSide,
          sideOffset,
          triggerRect,
          windowSize,
        }) >
        availableSpace({
          collisionPadding,
          side,
          sideOffset,
          triggerRect,
          windowSize,
        })
      ) ?
        oppositeSide
      : side;
  }

  const isVertical = side === "top" || side === "bottom";
  let x = 0;
  let y = 0;

  if (side === "bottom") {
    y = triggerRect.y + triggerRect.height + sideOffset + collisionPadding * 5;
  } else if (side === "top") {
    y = triggerRect.y - contentSize.height - sideOffset;
  } else if (side === "right") {
    x = triggerRect.x + triggerRect.width + sideOffset;
  } else {
    x = triggerRect.x - contentSize.width - sideOffset;
  }

  if (isVertical) {
    if (align === "start") {
      x = triggerRect.x + alignOffset;
    } else if (align === "end") {
      x = triggerRect.x + triggerRect.width - contentSize.width - alignOffset;
    } else {
      x =
        triggerRect.x +
        triggerRect.width / 2 -
        contentSize.width / 2 +
        alignOffset;
    }
  } else if (align === "start") {
    y = triggerRect.y + alignOffset;
  } else if (align === "end") {
    y = triggerRect.y + triggerRect.height - contentSize.height - alignOffset;
  } else {
    y =
      triggerRect.y +
      triggerRect.height / 2 -
      contentSize.height / 2 +
      alignOffset;
  }

  if (avoidCollisions) {
    if (isVertical) {
      x = clampCoordinate(
        x,
        contentSize.width,
        windowSize.width,
        collisionPadding,
      );
    } else {
      y = clampCoordinate(
        y,
        contentSize.height,
        windowSize.height,
        collisionPadding,
      );
    }
  }

  return { align, side, x, y };
}

export function transformOriginForSide(side: Side): string {
  switch (side) {
    case "top":
      return "center bottom";
    case "bottom":
      return "center top";
    case "left":
      return "right center";
    case "right":
      return "left center";
  }
}

export function entryOffsetForSide(side: Side): { x: number; y: number } {
  switch (side) {
    case "top":
      return { x: 0, y: 10 };
    case "bottom":
      return { x: 0, y: -10 };
    case "left":
      return { x: 10, y: 0 };
    case "right":
      return { x: -10, y: 0 };
  }
}

export type {
  Align,
  ComputedPosition,
  ComputePositionInput,
  Side,
} from "./types/positioning";
