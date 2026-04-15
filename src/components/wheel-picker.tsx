import MaskedView from "@react-native-masked-view/masked-view";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { IMaskContent, IPickerItem, IWheelPicker } from "@/types/wheel-picker";
import {
  ITEM_HEIGHT as DEFAULT_ITEM_HEIGHT,
  VISIBLE_ITEMS as DEFAULT_VISIBLE_ITEMS,
} from "../constants";

const PERSPECTIVE = 450;

function snapPoint(value: number, velocity: number, points: number[]) {
  "worklet";
  const projected = value + velocity * 0.24;
  let closest = points[0];
  let minDelta = Number.POSITIVE_INFINITY;

  for (let i = 0; i < points.length; i += 1) {
    const delta = Math.abs(projected - points[i]);
    if (delta < minDelta) {
      minDelta = delta;
      closest = points[i];
    }
  }

  return closest;
}

function rubberBandClamp(
  value: number,
  min: number,
  max: number,
  constant = 0.3,
) {
  "worklet";

  if (value < min) {
    return min - (min - value) * constant;
  }

  if (value > max) {
    return max + (value - max) * constant;
  }

  return value;
}

const PickerItem = memo<IPickerItem>(
  ({
    fontFamily,
    fontSize,
    halfCount,
    horizontalPadding,
    index,
    itemHeight,
    label,
    minimumFontScale,
    radius,
    radiusRel,
    textAlign,
    translateY,
  }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const scrollIndex =
        (halfCount * itemHeight - translateY.value) / itemHeight;

      const y = interpolate(
        scrollIndex,
        [index - radiusRel, index, index + radiusRel],
        [-1, 0, 1],
        Extrapolation.CLAMP,
      );

      const rotateX = Math.asin(y);
      const z = radius * Math.cos(rotateX) - radius;
      const scale = PERSPECTIVE / (PERSPECTIVE - z);

      return {
        transform: [
          { perspective: PERSPECTIVE },
          { rotateX: `${rotateX}rad` },
          { scale },
        ],
      };
    });

    return (
      <Animated.View
        style={[
          styles.item,
          animatedStyle,
          { height: itemHeight, paddingHorizontal: horizontalPadding },
        ]}
      >
        <Text
          allowFontScaling={false}
          ellipsizeMode="clip"
          maxFontSizeMultiplier={1}
          numberOfLines={1}
          style={[
            styles.label,
            {
              fontFamily,
              fontSize,
              letterSpacing: -fontSize * 0.024,
              lineHeight: itemHeight,
              textAlign,
            },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    );
  },
);

PickerItem.displayName = "PickerItem";

const MaskContent = ({
  fontFamily,
  fontSize,
  halfCount,
  horizontalPadding,
  items,
  itemHeight,
  minimumFontScale,
  radius,
  radiusRel,
  textAlign,
  translateY,
}: IMaskContent) => {
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={containerStyle}>
      {items.map((item, index) => (
        <PickerItem
          key={`${item}-${index}`}
          fontFamily={fontFamily}
          fontSize={fontSize}
          halfCount={halfCount}
          horizontalPadding={horizontalPadding}
          index={index}
          itemHeight={itemHeight}
          label={item}
          minimumFontScale={minimumFontScale}
          radius={radius}
          radiusRel={radiusRel}
          textAlign={textAlign}
          translateY={translateY}
        />
      ))}
    </Animated.View>
  );
};

export const WheelPicker = memo<IWheelPicker>(
  ({
    activeTextColor = "#FFFFFF",
    fontFamily,
    fontSize = 31,
    horizontalPadding = 20,
    inactiveTextColor = "rgba(255,255,255,0.34)",
    itemHeight = DEFAULT_ITEM_HEIGHT,
    items,
    minimumFontScale = 0.84,
    onIndexChange,
    onIndexPreviewChange,
    selectedIndex,
    textAlign = "center",
    visibleCount = DEFAULT_VISIBLE_ITEMS,
  }) => {
    const halfCount = Math.floor(visibleCount / 2);
    const pickerHeight = itemHeight * visibleCount;
    const radiusRel = visibleCount * 0.55;
    const radius = radiusRel * itemHeight;
    const outerSectionHeight = halfCount * itemHeight;

    const translateY = useSharedValue<number>(
      halfCount * itemHeight - selectedIndex * itemHeight,
    );
    const offset = useSharedValue<number>(0);
    const previewIndex = useSharedValue<number>(selectedIndex);
    const isSettling = useSharedValue<boolean>(false);
    const isDraggingRef = useRef<boolean>(false);

    const maxTranslateY = halfCount * itemHeight;
    const minTranslateY =
      halfCount * itemHeight - (items.length - 1) * itemHeight;
    const snapPoints = useMemo<number[]>(
      () =>
        Array.from(
          { length: items.length },
          (_, index) => halfCount * itemHeight - index * itemHeight,
        ),
      [halfCount, itemHeight, items.length],
    );

    useEffect(() => {
      isSettling.value = false;
      previewIndex.value = selectedIndex;
      if (isDraggingRef.current) return;

      cancelAnimation(translateY);
      translateY.value = withSpring(
        halfCount * itemHeight - selectedIndex * itemHeight,
        {
          damping: 18,
          mass: 0.85,
          stiffness: 185,
        },
      );
    }, [
      halfCount,
      isSettling,
      itemHeight,
      previewIndex,
      selectedIndex,
      translateY,
    ]);

    const reportChange = useCallback(
      (index: number) => {
        onIndexChange(Math.max(0, Math.min(index, items.length - 1)));
      },
      [items.length, onIndexChange],
    );

    const reportPreviewChange = useCallback(
      (index: number) => {
        onIndexPreviewChange?.(Math.max(0, Math.min(index, items.length - 1)));
      },
      [items.length, onIndexPreviewChange],
    );

    const setDragging = useCallback((dragging: boolean) => {
      isDraggingRef.current = dragging;
    }, []);

    useAnimatedReaction(
      () => {
        if (!isSettling.value) {
          return null;
        }

        return Math.max(
          0,
          Math.min(
            Math.round(
              (halfCount * itemHeight - translateY.value) / itemHeight,
            ),
            items.length - 1,
          ),
        );
      },
      (index, previousIndex) => {
        if (index === null || index === previousIndex) {
          return;
        }

        scheduleOnRN(reportChange, index);
        scheduleOnRN(reportPreviewChange, index);
      },
      [
        halfCount,
        itemHeight,
        items.length,
        reportChange,
        reportPreviewChange,
        translateY,
        isSettling,
      ],
    );

    const pan = Gesture.Pan()
      .onBegin(() => {
        cancelAnimation(translateY);
        isSettling.value = false;
        offset.value = translateY.value;
        previewIndex.value = Math.max(
          0,
          Math.min(
            Math.round(
              (halfCount * itemHeight - translateY.value) / itemHeight,
            ),
            items.length - 1,
          ),
        );
        scheduleOnRN(setDragging, true);
      })
      .onUpdate((event) => {
        const next = offset.value + event.translationY;
        translateY.value = rubberBandClamp(next, minTranslateY, maxTranslateY);

        const index = Math.max(
          0,
          Math.min(
            Math.round(
              (halfCount * itemHeight - translateY.value) / itemHeight,
            ),
            items.length - 1,
          ),
        );

        if (index !== previewIndex.value) {
          previewIndex.value = index;
          scheduleOnRN(reportChange, index);
          scheduleOnRN(reportPreviewChange, index);
        }
      })
      .onEnd((event) => {
        const settled = Math.max(
          minTranslateY,
          Math.min(translateY.value, maxTranslateY),
        );
        const destination = snapPoint(settled, event.velocityY, snapPoints);
        const clamped = Math.max(
          minTranslateY,
          Math.min(destination, maxTranslateY),
        );

        isSettling.value = true;
        translateY.value = withSpring(
          clamped,
          {
            damping: 18,
            mass: 0.9,
            stiffness: 165,
            velocity: event.velocityY,
          },
          (finished) => {
            if (finished) {
              isSettling.value = false;
            }
          },
        );
        scheduleOnRN(setDragging, false);
      })
      .onFinalize(() => {
        isSettling.value = false;
        scheduleOnRN(setDragging, false);
      });

    if (!items.length) {
      return <View style={[styles.column, { height: pickerHeight }]} />;
    }

    return (
      <View style={[styles.column, { height: pickerHeight }]}>
        <MaskedView
          style={styles.mask}
          maskElement={
            <View
              collapsable={false}
              style={[styles.mask, { height: pickerHeight }]}
            >
              <MaskContent
                fontFamily={fontFamily}
                fontSize={fontSize}
                halfCount={halfCount}
                horizontalPadding={horizontalPadding}
                items={items}
                itemHeight={itemHeight}
                minimumFontScale={minimumFontScale}
                radius={radius}
                radiusRel={radiusRel}
                textAlign={textAlign}
                translateY={translateY}
              />
            </View>
          }
        >
          <View style={[styles.maskFill, { height: pickerHeight }]}>
            <View
              style={[
                styles.maskSection,
                {
                  backgroundColor: inactiveTextColor,
                  height: outerSectionHeight,
                },
              ]}
            />
            <View
              style={[
                styles.maskSection,
                {
                  backgroundColor: activeTextColor,
                  height: itemHeight,
                },
              ]}
            />
            <View
              style={[
                styles.maskSection,
                {
                  backgroundColor: inactiveTextColor,
                  height: outerSectionHeight,
                },
              ]}
            />
          </View>
        </MaskedView>

        <GestureDetector gesture={pan}>
          <Animated.View style={StyleSheet.absoluteFill} />
        </GestureDetector>
      </View>
    );
  },
);

WheelPicker.displayName = "WheelPicker";

const styles = StyleSheet.create({
  column: {
    flex: 1,
    overflow: "hidden",
  },
  mask: {
    flex: 1,
  },
  maskFill: {
    width: "100%",
  },
  maskSection: {
    width: "100%",
  },
  item: {
    justifyContent: "center",
  },
  label: {
    color: "#FFFFFF",
    fontWeight: "500",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});
