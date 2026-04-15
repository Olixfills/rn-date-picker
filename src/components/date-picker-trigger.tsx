import type { DatePickerTriggerProps } from "@/dropdown";
import { useFonts } from "expo-font";
import React, { memo, useEffect } from "react";
import { Pressable, StyleSheet, View, type TextStyle } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SquircleView } from "~/squircle";
import { useDatePickerContext } from "../hooks/use-date-picker-context";
import { formatTriggerLabel } from "../utils/date-format";

export const DatePickerTrigger = memo<DatePickerTriggerProps>(
  ({ children, hitSlop = 8, style }) => {
    const progress = useSharedValue<number>(0);
    const { triggerRef, toggle, value, open } = useDatePickerContext();
    const [fontLoaded] = useFonts({
      SfProRounded: require("@/assets/fonts/sf-pro-rounded.otf"),
    });
    useEffect(() => {
      progress.value = open ? 1 : 0;
    }, [open]);

    const animatedTextStylez = useAnimatedStyle<Pick<TextStyle, "color">>(
      () => {
        return {
          color: withSpring(
            interpolateColor(progress.value, [0, 1], ["#fff", "#0a97fd"]),
          ),
        };
      },
    );

    return (
      <View style={styles.triggerRoot}>
        <Pressable
          hitSlop={hitSlop}
          onPress={toggle}
          style={({ pressed }) => [
            styles.trigger,
            pressed && styles.triggerPressed,
            style,
          ]}
        >
          <View
            ref={triggerRef}
            collapsable={false}
            style={styles.triggerContent}
          >
            {children ?? (
              <SquircleView
                backgroundColor="#2A2A2D"
                borderColor="rgba(255,255,255,0.04)"
                cornerRadius={100}
                cornerSmoothing={0}
                style={styles.triggerPill}
              >
                <Animated.Text
                  style={[
                    styles.triggerText,
                    { fontFamily: fontLoaded ? "SfProRounded" : undefined },
                    animatedTextStylez,
                  ]}
                >
                  {formatTriggerLabel(value)}
                </Animated.Text>
              </SquircleView>
            )}
          </View>
        </Pressable>
      </View>
    );
  },
);

DatePickerTrigger.displayName = "DatePickerDropdown.Trigger";

const styles = StyleSheet.create({
  trigger: {
    alignItems: "center",
    justifyContent: "center",
  },
  triggerPill: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  triggerContent: {
    alignSelf: "flex-start",
  },
  triggerPressed: {
    opacity: 0.7,
  },
  triggerRoot: {
    alignSelf: "flex-start",
  },
  triggerText: {
    color: "#0a97fd",
    fontSize: 16,
  },
});
