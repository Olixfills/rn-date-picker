import type {
  DatePickerContentMode,
  DatePickerContentProps,
} from "@/types/date-picker";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  memo,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  LayoutChangeEvent,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import {
  CALENDAR_DECELERATION_RATE,
  DROPDOWN_WHEEL_VISIBLE_COUNT,
  HEADER_HEIGHT,
  MAX_CALENDAR_ROWS,
  MONTHS,
  MONTHS_LOOPED,
  MONTH_LOOP_MIDDLE,
  PANEL_INNER_WIDTH,
  PANEL_PADDING_BOTTOM,
  PANEL_PADDING_H,
  PANEL_PADDING_TOP,
  PANEL_WIDTH,
  STAGE_GAP,
  WEEKDAYS,
  WEEKDAY_HEIGHT,
} from "../constants";
import { useDatePickerContext } from "../hooks/use-date-picker-context";
import {
  computePosition,
  entryOffsetForSide,
  transformOriginForSide,
} from "../positioning";

import {
  clampIndex,
  computeStageHeight,
  indexToMonth,
  monthToIndex,
} from "@/utils/calendar";
import { MonthPage } from "./month-page";
import { WheelPicker } from "./wheel-picker";

const SegmentedControl = memo(({
  values,
  selectedIndex,
  onChange,
  fontLoaded,
}: {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  fontLoaded: boolean;
}) => {
  const progress = useSharedValue(selectedIndex);

  useEffect(() => {
    progress.value = withSpring(selectedIndex, { damping: 20, stiffness: 220 });
  }, [selectedIndex]);

  const indicatorStyle = useAnimatedStyle(() => {
    const widthPercent = 100 / values.length;
    return {
      width: `${widthPercent}%`,
      left: `${progress.value * widthPercent}%`,
    };
  });

  return (
    <View style={styles.segmentedContainer}>
      <Animated.View style={[styles.segmentedIndicator, indicatorStyle]} />
      {values.map((val, idx) => (
        <Pressable
          key={val}
          onPress={() => onChange(idx)}
          style={styles.segmentedSegment}
        >
          <Text
            style={[
              styles.segmentedText,
              fontLoaded && { fontFamily: "SfProRounded" },
              selectedIndex === idx && styles.segmentedTextActive,
            ]}
          >
            {val}
          </Text>
        </Pressable>
      ))}
    </View>
  );
});

SegmentedControl.displayName = "SegmentedControl";

function get24HourFrom12Hour(hour12: number, ampm: "AM" | "PM"): number {
  if (ampm === "PM") {
    return hour12 === 12 ? 12 : hour12 + 12;
  } else {
    return hour12 === 12 ? 0 : hour12;
  }
}

export const DatePickerContent = memo<DatePickerContentProps>(
  ({
    align = "center",
    alignOffset = 0,
    avoidCollisions = true,
    collisionPadding = 8,
    side: preferredSide = "bottom",
    sideOffset = 6,
  }) => {
    const {
      maxYear,
      measureTrigger,
      minYear,
      open,
      setOpen,
      setValue,
      triggerRect,
      value,
      minDate,
      maxDate,
      minTime,
      maxTime,
      mode: pickerMode,
      is24Hour,
    } = useDatePickerContext();
    const [fontLoaded] = useFonts({
      SfProRounded: require("@/assets/fonts/sf-pro-rounded.otf"),
    });
    const wheelSoundPlayer = useAudioPlayer(
      require("@/assets/sound/wheeloftime.mp3"),
    );
    const [mounted, setMounted] = useState(false);
    const [viewMonth, setViewMonth] = useState(value.month);
    const [viewYear, setViewYear] = useState(value.year);
    const [monthWheelIndex, setMonthWheelIndex] = useState(
      MONTH_LOOP_MIDDLE * MONTHS.length + value.month,
    );
    const [dateViewMode, setDateViewMode] = useState<DatePickerContentMode>("calendar");
    const [activeTab, setActiveTab] = useState<"date" | "time">("date");
    const currentTab = pickerMode === "time" ? "time" : (pickerMode === "date" ? "date" : activeTab);
    const [calendarPageWidth, setCalendarPageWidth] =
      useState(PANEL_INNER_WIDTH);

    const progress = useSharedValue(0);
    const modeProgress = useSharedValue(0);
    const tabProgress = useSharedValue(pickerMode === "time" ? 1 : 0);

    const window = useWindowDimensions();

    const yearItems = useMemo(
      () =>
        Array.from({ length: maxYear - minYear + 1 }, (_, index) =>
          String(minYear + index),
        ),
      [maxYear, minYear],
    );
    const calendarColumnWidth = calendarPageWidth / 7;
    const stageHeight = computeStageHeight(MAX_CALENDAR_ROWS);
    const wheelItemHeight = stageHeight / DROPDOWN_WHEEL_VISIBLE_COUNT;
    const wheelIndicatorHeight = wheelItemHeight + 6;
    const wheelViewportWidth = PANEL_INNER_WIDTH - 4;
    const wheelColumnGap = 14;
    const wheelYearColumnWidth = 136;
    const wheelMonthColumnWidth =
      wheelViewportWidth - wheelYearColumnWidth - wheelColumnGap;
    const baseHeight =
      PANEL_PADDING_TOP + PANEL_PADDING_BOTTOM + HEADER_HEIGHT + STAGE_GAP;
    const panelHeight = baseHeight + stageHeight;
    const wheelOverlayClearInset = wheelIndicatorHeight / (stageHeight * 2);
    const wheelOverlayTopClear = Math.max(
      0.34,
      0.5 - wheelOverlayClearInset - 0.03,
    );
    const wheelOverlayBottomClear = Math.min(
      0.66,
      0.5 + wheelOverlayClearInset + 0.03,
    );
    const wheelOverlayLocations = [
      0,
      0.12,
      Math.max(0.18, wheelOverlayTopClear - 0.14),
      wheelOverlayTopClear,
      wheelOverlayBottomClear,
      Math.min(0.82, wheelOverlayBottomClear + 0.14),
      0.88,
      1,
    ];
    const wheelOverlayColors = [
      "rgba(28,28,30,0.94)",
      "rgba(28,28,30,0.72)",
      "rgba(28,28,30,0.30)",
      "rgba(28,28,30,0.05)",
      "rgba(28,28,30,0.05)",
      "rgba(28,28,30,0.30)",
      "rgba(28,28,30,0.72)",
      "rgba(28,28,30,0.94)",
    ];
    const canGoPrev = viewYear > minYear || viewMonth > 0;
    const canGoNext = viewYear < maxYear || viewMonth < 11;

    const position = useMemo(() => {
      if (!triggerRect) {
        return { align, side: preferredSide, x: 0, y: 0 };
      }

      return computePosition({
        align,
        alignOffset,
        avoidCollisions,
        collisionPadding,
        contentSize: { height: panelHeight, width: PANEL_WIDTH },
        side: preferredSide,
        sideOffset,
        triggerRect,
        windowSize: { height: window.height, width: window.width },
      });
    }, [
      align,
      alignOffset,
      avoidCollisions,
      collisionPadding,
      panelHeight,
      preferredSide,
      sideOffset,
      triggerRect,
      window.height,
      window.width,
    ]);

    const transformOrigin = useMemo(
      () => transformOriginForSide(position.side),
      [position.side],
    );
    const entryOffset = useMemo(
      () => entryOffsetForSide(position.side),
      [position.side],
    );

    const requestClose = useCallback(() => {
      setOpen(false);
    }, [setOpen]);

    useEffect(() => {
      if (!open) return;

      measureTrigger();
      setMounted(true);
      setViewMonth(value.month);
      setViewYear(value.year);
      setMonthWheelIndex(MONTH_LOOP_MIDDLE * MONTHS.length + value.month);
      setDateViewMode("calendar");
      progress.value = 0;
      modeProgress.value = 0;
    }, [measureTrigger, modeProgress, open, progress, value.month, value.year]);

    useEffect(() => {
      if (dateViewMode === "wheel") return;

      setMonthWheelIndex(MONTH_LOOP_MIDDLE * MONTHS.length + viewMonth);
    }, [dateViewMode, viewMonth]);

    useEffect(() => {
      if (!open) return;
      measureTrigger();
    }, [measureTrigger, open, window.height, window.width]);

    useEffect(() => {
      if (!mounted || !open) return;

      cancelAnimation(progress);
      progress.value = withSpring(1, {
        damping: 22,
        mass: 0.9,
        overshootClamping: false,
        stiffness: 260,
      });
    }, [mounted, open, progress]);

    useEffect(() => {
      if (open || !mounted) return;

      cancelAnimation(progress);
      progress.value = withTiming(
        0,
        {
          duration: 180,
          easing: Easing.bezier(0.4, 0, 1, 1),
        },
        (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        },
      );
    }, [mounted, open, progress]);

    const panelStyle = useAnimatedStyle(() => {
      const current = progress.value;

      return {
        opacity: interpolate(current, [0, 0.3, 1], [0, 0.5, 1]),
        transform: [
          { translateX: interpolate(current, [0, 1], [entryOffset.x, 0]) },
          { translateY: interpolate(current, [0, 1], [entryOffset.y, 0]) },
          { scale: interpolate(current, [0, 1], [0.45, 1]) },
        ],
      };
    });

    const backdropStyle = useAnimatedStyle(() => ({
      backgroundColor: "rgba(0,0,0,0.4)",
      opacity: interpolate(progress.value, [0, 1], [0, 1]),
    }));

    const calendarFadeStyle = useAnimatedStyle(() => ({
      opacity: 1 - modeProgress.value,
    }));

    const wheelFadeStyle = useAnimatedStyle(() => ({
      opacity: modeProgress.value,
    }));

    const navFadeStyle = useAnimatedStyle(() => ({
      opacity: 1 - modeProgress.value,
    }));

    const dateTabStyle = useAnimatedStyle(() => ({
      opacity: interpolate(tabProgress.value, [0, 1], [1, 0]),
      transform: [{ scale: interpolate(tabProgress.value, [0, 1], [1, 0.94]) }],
    }));

    const timeTabStyle = useAnimatedStyle(() => ({
      opacity: interpolate(tabProgress.value, [0, 1], [0, 1]),
      transform: [{ scale: interpolate(tabProgress.value, [0, 1], [0.94, 1]) }],
    }));

    const monthChevronAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { rotate: `${modeProgress.value * 90}deg` },
        { translateY: modeProgress.value * 0.5 },
      ],
    }));

    const textStylez = useAnimatedStyle(() => ({
      color: interpolateColor(
        modeProgress.value,
        [0, 1],
        ["#F2F2F7", "#0a97fd"],
      ),
    }));

    useEffect(() => {
      if (pickerMode === "time") {
        tabProgress.value = 1;
      } else if (pickerMode === "date") {
        tabProgress.value = 0;
      } else {
        tabProgress.value = withSpring(activeTab === "time" ? 1 : 0, {
          damping: 20,
          stiffness: 220,
        });
      }
    }, [activeTab, pickerMode, tabProgress]);

    useEffect(() => {
      wheelSoundPlayer.loop = false;
      wheelSoundPlayer.volume = 0.16;
    }, [wheelSoundPlayer]);

    const toggleMode = useCallback(() => {
      const nextMode = dateViewMode === "calendar" ? "wheel" : "calendar";
      setDateViewMode(nextMode);
      modeProgress.value = withTiming(nextMode === "wheel" ? 1 : 0, {
        duration: 260,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
    }, [dateViewMode, modeProgress]);

    const handleSelectDay = useCallback(
      (day: number, month: number, year: number) => {
        setValue({ ...value, day, month, year });
        requestClose();
      },
      [requestClose, setValue, value],
    );

    const moveByMonth = useCallback(
      (delta: number) => {
        let nextMonth = viewMonth + delta;
        let nextYear = viewYear;
        if (nextMonth < 0) {
          nextMonth = 11;
          nextYear -= 1;
        } else if (nextMonth > 11) {
          nextMonth = 0;
          nextYear += 1;
        }

        // Clamp to minYear and maxYear
        if (nextYear < minYear || nextYear > maxYear) return;

        setViewMonth(nextMonth);
        setViewYear(nextYear);
      },
      [viewMonth, viewYear, minYear, maxYear],
    );

    const playWheelTick = useCallback(() => {
      void wheelSoundPlayer
        .seekTo(0)
        .catch(() => {})
        .finally(() => {
          wheelSoundPlayer.play();
        });
    }, [wheelSoundPlayer]);

    const handleWheelMonthChange = useCallback(
      (index: number) => {
        const normalizedMonth = index % MONTHS.length;
        startTransition(() => {
          setMonthWheelIndex(index);
          setViewMonth((current) => {
            if (current === normalizedMonth) return current;
            playWheelTick();
            return normalizedMonth;
          });
        });
      },
      [playWheelTick],
    );

    const handleWheelYearChange = useCallback(
      (index: number) => {
        const nextYear = minYear + index;
        startTransition(() => {
          setViewYear((current) => {
            if (current === nextYear) return current;
            playWheelTick();
            return nextYear;
          });
        });
      },
      [minYear, playWheelTick],
    );

    // --- Time Selection Helpers ---
    const hours = useMemo(() => {
      if (is24Hour) {
        return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
      } else {
        return Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, "0"));
      }
    }, [is24Hour]);

    const minutesList = useMemo(() => {
      return Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
    }, []);

    const ampms = useMemo(() => ["AM", "PM"], []);

    const selectedHourIndex = useMemo(() => {
      const hr = value.hour ?? 10;
      if (is24Hour) {
        return Math.max(0, Math.min(hr, 23));
      } else {
        const displayHour = hr % 12 === 0 ? 12 : hr % 12;
        return displayHour - 1;
      }
    }, [value.hour, is24Hour]);

    const selectedMinuteIndex = useMemo(() => {
      return Math.max(0, Math.min(value.minute ?? 0, 59));
    }, [value.minute]);

    const selectedAmpmIndex = useMemo(() => {
      const hr = value.hour ?? 10;
      return hr >= 12 ? 1 : 0;
    }, [value.hour]);

    const handleHourChange = useCallback((index: number) => {
      let targetHour = 10;
      if (is24Hour) {
        targetHour = index;
      } else {
        const displayHour = index + 1;
        const isPm = (value.hour ?? 10) >= 12;
        targetHour = get24HourFrom12Hour(displayHour, isPm ? "PM" : "AM");
      }
      startTransition(() => {
        playWheelTick();
        setValue({ ...value, hour: targetHour });
      });
    }, [value, is24Hour, setValue, playWheelTick]);

    const handleMinuteChange = useCallback((index: number) => {
      startTransition(() => {
        playWheelTick();
        setValue({ ...value, minute: index });
      });
    }, [value, setValue, playWheelTick]);

    const handleAmpmChange = useCallback((index: number) => {
      const targetAmpm = index === 1 ? "PM" : "AM";
      const hr = value.hour ?? 10;
      const hour12 = hr % 12 === 0 ? 12 : hr % 12;
      const targetHour = get24HourFrom12Hour(hour12, targetAmpm);
      startTransition(() => {
        playWheelTick();
        setValue({ ...value, hour: targetHour });
      });
    }, [value, setValue, playWheelTick]);

    const timeColumnWidth = is24Hour ? wheelViewportWidth / 2 : wheelViewportWidth / 3;

    return (
      <Modal
        animationType="none"
        onRequestClose={requestClose}
        statusBarTranslucent
        transparent
        visible={mounted}
      >
        <GestureHandlerRootView style={styles.modalRoot}>
          <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
            <Pressable onPress={requestClose} style={StyleSheet.absoluteFill} />
          </Animated.View>
          <Animated.View
            style={[
              styles.panelAnchor,
              {
                height: panelHeight + (pickerMode === "datetime" ? 48 : 0),
                left: position.x,
                top: position.y,
                transformOrigin,
                width: PANEL_WIDTH,
              },
              panelStyle,
            ]}
          >
            <View style={styles.panelSurface}>
              <View
                style={[
                  styles.panelInner,
                  {
                    paddingBottom: PANEL_PADDING_BOTTOM,
                    paddingHorizontal: PANEL_PADDING_H,
                    paddingTop: PANEL_PADDING_TOP,
                  },
                ]}
              >
                <View style={[styles.header, { height: HEADER_HEIGHT }]}>
                  {currentTab === "date" ? (
                    <Pressable
                      hitSlop={6}
                      onPress={toggleMode}
                      style={({ pressed }) => [
                        styles.monthLabelButton,
                        pressed && styles.triggerPressed,
                      ]}
                    >
                      <Animated.Text
                        style={[
                          styles.monthLabel,
                          textStylez,
                          {
                            fontFamily: fontLoaded ? "SfProRounded" : undefined,
                          },
                        ]}
                      >
                        {MONTHS[viewMonth]} {viewYear}
                      </Animated.Text>
                      <Animated.View
                        style={[
                          styles.monthChevronWrap,
                          monthChevronAnimatedStyle,
                        ]}
                      >
                        <FontAwesome6
                          name="chevron-right"
                          color="#0a97fd"
                          size={15}
                        />
                      </Animated.View>
                    </Pressable>
                  ) : (
                    <Text
                      style={[
                        styles.monthLabel,
                        {
                          fontFamily: fontLoaded ? "SfProRounded" : undefined,
                          color: "#F2F2F7",
                        },
                      ]}
                    >
                      {pickerMode === "time" ? "Select Time" : "Time Selection"}
                    </Text>
                  )}

                  {currentTab === "date" && (
                    <Animated.View style={[styles.navRow, navFadeStyle]}>
                      <Pressable
                        disabled={dateViewMode !== "calendar" || !canGoPrev}
                        hitSlop={10}
                        onPress={() => moveByMonth(-1)}
                        style={({ pressed }) => [
                          styles.navButton,
                          pressed && styles.triggerPressed,
                        ]}
                      >
                        <Ionicons
                          color={canGoPrev ? "#F2F2F7" : "rgba(235,235,245,0.24)"}
                          name="chevron-back"
                          size={32}
                        />
                      </Pressable>
                      <Pressable
                        disabled={dateViewMode !== "calendar" || !canGoNext}
                        hitSlop={10}
                        onPress={() => moveByMonth(1)}
                        style={({ pressed }) => [
                          styles.navButton,
                          pressed && styles.triggerPressed,
                        ]}
                      >
                        <Ionicons
                          color={canGoNext ? "#F2F2F7" : "rgba(235,235,245,0.24)"}
                          name="chevron-forward"
                          size={32}
                        />
                      </Pressable>
                    </Animated.View>
                  )}
                </View>

                {/* Segmented Control for Datetime Mode */}
                {pickerMode === "datetime" && (
                  <SegmentedControl
                    values={["Date", "Time"]}
                    selectedIndex={activeTab === "date" ? 0 : 1}
                    onChange={(idx) => setActiveTab(idx === 0 ? "date" : "time")}
                    fontLoaded={fontLoaded}
                  />
                )}

                <Animated.View
                  style={[
                    styles.stage,
                    { height: stageHeight, marginTop: STAGE_GAP },
                  ]}
                >
                  {/* DATE TAB LAYER */}
                  <Animated.View
                    pointerEvents={currentTab === "date" ? "auto" : "none"}
                    style={[StyleSheet.absoluteFill, dateTabStyle]}
                  >
                    <Animated.View
                      pointerEvents={dateViewMode === "calendar" ? "auto" : "none"}
                      style={[styles.calendarLayer, calendarFadeStyle]}
                    >
                      <View style={[styles.weekdays, { height: WEEKDAY_HEIGHT }]}>
                        {WEEKDAYS.map((label) => (
                          <Text
                            key={label}
                            style={[
                              styles.weekdayLabel,
                              {
                                fontFamily:
                                  fontLoaded ? "SfProRounded" : undefined,
                              },
                              { width: calendarColumnWidth },
                            ]}
                          >
                            {label}
                          </Text>
                        ))}
                      </View>
                      <MonthPage
                        fontFamily={fontLoaded ? "SfProRounded" : undefined}
                        month={viewMonth}
                        onSelect={handleSelectDay}
                        pageWidth={calendarPageWidth}
                        selectedDay={
                          value.month === viewMonth && value.year === viewYear ?
                            value.day
                          : null
                        }
                        year={viewYear}
                      />
                    </Animated.View>

                    <Animated.View
                      pointerEvents={dateViewMode === "wheel" ? "auto" : "none"}
                      style={[
                        styles.stageLayer,
                        styles.wheelLayer,
                        wheelFadeStyle,
                      ]}
                    >
                      <View
                        style={[
                          styles.wheelViewport,
                          {
                            height: stageHeight,
                            width: wheelViewportWidth,
                          },
                        ]}
                      >
                        <View style={[styles.wheelRow, { height: stageHeight }]}>
                          <View
                            style={[
                              styles.wheelMonthCol,
                              { width: wheelMonthColumnWidth },
                            ]}
                          >
                            <WheelPicker
                              fontFamily={fontLoaded ? "SfProRounded" : undefined}
                              fontSize={Math.max(18, wheelItemHeight * 0.62)}
                              horizontalPadding={20}
                              itemHeight={wheelItemHeight}
                              items={MONTHS_LOOPED}
                              minimumFontScale={0.82}
                              onIndexChange={handleWheelMonthChange}
                              selectedIndex={monthWheelIndex}
                              textAlign="left"
                              visibleCount={DROPDOWN_WHEEL_VISIBLE_COUNT}
                            />
                          </View>
                          <View
                            style={[
                              styles.wheelYearCol,
                              {
                                marginLeft: wheelColumnGap,
                                width: wheelYearColumnWidth,
                              },
                            ]}
                          >
                            <WheelPicker
                              fontFamily={fontLoaded ? "SfProRounded" : undefined}
                              fontSize={Math.max(18, wheelItemHeight * 0.62)}
                              horizontalPadding={20}
                              itemHeight={wheelItemHeight}
                              items={yearItems}
                              onIndexChange={handleWheelYearChange}
                              selectedIndex={Math.max(
                                0,
                                Math.min(
                                  viewYear - minYear,
                                  yearItems.length - 1,
                                ),
                              )}
                              textAlign="right"
                              visibleCount={DROPDOWN_WHEEL_VISIBLE_COUNT}
                            />
                          </View>
                        </View>
                        <LinearGradient
                          colors={wheelOverlayColors as any}
                          locations={wheelOverlayLocations as any}
                          pointerEvents="none"
                          style={styles.wheelFadeOverlay}
                        />
                        <View
                          pointerEvents="none"
                          style={[
                            styles.wheelIndicatorWrap,
                            {
                              marginTop: -wheelIndicatorHeight / 2,
                              top: "50%",
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.wheelIndicator,
                              {
                                borderRadius: wheelIndicatorHeight / 2,
                                height: wheelIndicatorHeight,
                                width: wheelViewportWidth,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </Animated.View>
                </Animated.View>

                {/* TIME TAB LAYER */}
                <Animated.View
                  pointerEvents={currentTab === "time" ? "auto" : "none"}
                  style={[StyleSheet.absoluteFill, timeTabStyle]}
                >
                  <View
                    style={[
                      styles.wheelViewport,
                      {
                        height: stageHeight,
                        width: wheelViewportWidth,
                      },
                    ]}
                  >
                    <View style={[styles.wheelRow, { height: stageHeight }]}>
                      {/* Hour Column */}
                      <View style={{ width: timeColumnWidth }}>
                        <WheelPicker
                          fontFamily={fontLoaded ? "SfProRounded" : undefined}
                          fontSize={Math.max(20, wheelItemHeight * 0.62)}
                          horizontalPadding={12}
                          itemHeight={wheelItemHeight}
                          items={hours}
                          onIndexChange={handleHourChange}
                          selectedIndex={selectedHourIndex}
                          textAlign={is24Hour ? "right" : "center"}
                          visibleCount={DROPDOWN_WHEEL_VISIBLE_COUNT}
                        />
                      </View>

                      {/* Minute Column */}
                      <View style={{ width: timeColumnWidth }}>
                        <WheelPicker
                          fontFamily={fontLoaded ? "SfProRounded" : undefined}
                          fontSize={Math.max(20, wheelItemHeight * 0.62)}
                          horizontalPadding={12}
                          itemHeight={wheelItemHeight}
                          items={minutesList}
                          onIndexChange={handleMinuteChange}
                          selectedIndex={selectedMinuteIndex}
                          textAlign={is24Hour ? "left" : "center"}
                          visibleCount={DROPDOWN_WHEEL_VISIBLE_COUNT}
                        />
                      </View>

                      {/* AM/PM Column */}
                      {!is24Hour && (
                        <View style={{ width: timeColumnWidth }}>
                          <WheelPicker
                            fontFamily={fontLoaded ? "SfProRounded" : undefined}
                            fontSize={Math.max(20, wheelItemHeight * 0.62)}
                            horizontalPadding={12}
                            itemHeight={wheelItemHeight}
                            items={ampms}
                            onIndexChange={handleAmpmChange}
                            selectedIndex={selectedAmpmIndex}
                            textAlign="left"
                            visibleCount={DROPDOWN_WHEEL_VISIBLE_COUNT}
                          />
                        </View>
                      )}
                    </View>
                    <LinearGradient
                      colors={wheelOverlayColors as any}
                      locations={wheelOverlayLocations as any}
                      pointerEvents="none"
                      style={styles.wheelFadeOverlay}
                    />
                    <View
                      pointerEvents="none"
                      style={[
                        styles.wheelIndicatorWrap,
                        {
                          marginTop: -wheelIndicatorHeight / 2,
                          top: "50%",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.wheelIndicator,
                          {
                            borderRadius: wheelIndicatorHeight / 2,
                            height: wheelIndicatorHeight,
                            width: wheelViewportWidth,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </Animated.View>
              </Animated.View>
            </View>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
},
);

DatePickerContent.displayName = "DatePickerDropdown.Content";

const styles = StyleSheet.create({
  calendarLayer: {
    flex: 1,
    overflow: "hidden",
  },
  calendarPager: {
    flex: 1,
    width: "100%",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  modalRoot: {
    flex: 1,
  },
  monthChevronWrap: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    marginLeft: 0,
    marginTop: 1,
    width: 24,
  },
  monthLabel: {
    color: "#F2F2F7",
    fontSize: 20,
    // fontWeight: "700",
    // letterSpacing: -0.6,
  },
  monthLabelButton: {
    alignItems: "center",
    flexDirection: "row",
  },
  navButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  navRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  panelAnchor: {
    overflow: "visible",
    position: "absolute",
  },
  panelInner: {
    flex: 1,
  },
  panelSurface: {
    backgroundColor: "#1C1C1E",
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 28,
    borderWidth: 1,
    flex: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
  },
  stage: {
    overflow: "hidden",
  },
  stageLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  triggerPressed: {
    opacity: 0.7,
  },
  weekdayLabel: {
    color: "rgba(235,235,245,0.30)",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.6,
    textAlign: "center",
  },
  weekdays: {
    alignItems: "center",
    flexDirection: "row",
  },
  wheelIndicator: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  wheelIndicatorWrap: {
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 2,
  },
  wheelFadeOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  wheelLayer: {
    alignItems: "center",
    justifyContent: "center",
  },
  wheelMonthCol: {
    flexShrink: 0,
  },
  wheelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    zIndex: 0,
  },
  wheelViewport: {
    alignSelf: "center",
    position: "relative",
  },
  wheelYearCol: {
    flexShrink: 0,
  },
  segmentedContainer: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 9,
    flexDirection: "row",
    height: 34,
    marginBottom: 8,
    padding: 2,
    position: "relative",
    width: PANEL_INNER_WIDTH,
  },
  segmentedIndicator: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 7,
    bottom: 2,
    position: "absolute",
    top: 2,
  },
  segmentedSegment: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  segmentedText: {
    color: "rgba(235,235,245,0.6)",
    fontSize: 13,
    fontWeight: "600",
  },
  segmentedTextActive: {
    color: "#FFFFFF",
  },
});
