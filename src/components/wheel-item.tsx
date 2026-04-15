import React, { memo } from "react";
import { Text } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import { ITEM_HEIGHT } from "@/constants";
import type { IWheelItem } from "../types/wheel-picker";

export const WheelItem = memo<IWheelItem>(
  ({ label, index, scrollY, fontFamily, textAlign = "center" }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const centerOffset = scrollY.value / ITEM_HEIGHT;
      const distance = Math.abs(index - centerOffset);

      const opacity = interpolate(
        distance,
        [0, 1, 2, 3, 4],
        [1, 0.6, 0.35, 0.15, 0.05],
        Extrapolation.CLAMP,
      );

      const scale = interpolate(
        distance,
        [0, 1, 2, 3],
        [1, 0.92, 0.85, 0.78],
        Extrapolation.CLAMP,
      );

      return { opacity, transform: [{ scale }] };
    });

    return (
      <Animated.View
        style={[
          { height: ITEM_HEIGHT, justifyContent: "center" },
          animatedStyle,
        ]}
      >
        <Text
          numberOfLines={1}
          style={{
            color: "#fff",
            fontSize: 34,
            fontFamily,
            fontWeight: "500",
            textAlign,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    );
  },
);

WheelItem.displayName = "WheelItem";
