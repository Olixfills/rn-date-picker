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
    const [mode, setMode] = useState<DatePickerContentMode>("calendar");
    const [calendarPageWidth, setCalendarPageWidth] =
      useState(PANEL_INNER_WIDTH);

    const progress = useSharedValue(0);
    const modeProgress = useSharedValue(0);
    const calendarRef = useRef<FlatList<number>>(null);
    const previousModeRef = useRef(mode);
    const window = useWindowDimensions();

    const yearItems = useMemo(
      () =>
        Array.from({ length: maxYear - minYear + 1 }, (_, index) =>
          String(minYear + index),
        ),
      [maxYear, minYear],
    );
    const monthCount = useMemo(
      () => (maxYear - minYear + 1) * 12,
      [maxYear, minYear],
    );
    const monthIndexes = useMemo(
      () => Array.from({ length: monthCount }, (_, index) => index),
      [monthCount],
    );
    const viewIndex = useMemo(
      () => monthToIndex(viewYear, viewMonth, minYear),
      [minYear, viewMonth, viewYear],
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
    const canGoPrev = viewIndex > 0;
    const canGoNext = viewIndex < monthCount - 1;

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
      setMode("calendar");
      previousModeRef.current = "calendar";
      progress.value = 0;
      modeProgress.value = 0;
    }, [measureTrigger, modeProgress, open, progress, value.month, value.year]);

    useEffect(() => {
      if (mode === "wheel") return;

      setMonthWheelIndex(MONTH_LOOP_MIDDLE * MONTHS.length + viewMonth);
    }, [mode, viewMonth]);

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
      wheelSoundPlayer.loop = false;
      wheelSoundPlayer.volume = 0.16;
    }, [wheelSoundPlayer]);

    const toggleMode = useCallback(() => {
      const nextMode = mode === "calendar" ? "wheel" : "calendar";
      setMode(nextMode);
      modeProgress.value = withTiming(nextMode === "wheel" ? 1 : 0, {
        duration: 260,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
    }, [mode, modeProgress]);

    const syncCalendar = useCallback((index: number, animated: boolean) => {
      requestAnimationFrame(() => {
        calendarRef.current?.scrollToIndex({ animated, index });
      });
    }, []);

    const resolveCalendarIndex = useCallback(
      (offsetX: number) =>
        clampIndex(Math.round(offsetX / calendarPageWidth), monthCount),
      [calendarPageWidth, monthCount],
    );

    useEffect(() => {
      if (!mounted) return;

      if (previousModeRef.current !== "calendar" && mode === "calendar") {
        syncCalendar(viewIndex, false);
      }

      previousModeRef.current = mode;
    }, [mode, mounted, syncCalendar, viewIndex]);

    const handleSelectDay = useCallback(
      (day: number, month: number, year: number) => {
        setValue({ day, month, year });
        requestClose();
      },
      [requestClose, setValue],
    );

    const setViewFromIndex = useCallback(
      (index: number) => {
        const clamped = clampIndex(index, monthCount);
        const target = indexToMonth(clamped, minYear);
        setViewMonth(target.month);
        setViewYear(target.year);
      },
      [minYear, monthCount],
    );

    const handleCalendarMomentumEnd = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const nextIndex = resolveCalendarIndex(
          event.nativeEvent.contentOffset.x,
        );
        setViewFromIndex(nextIndex);
      },
      [resolveCalendarIndex, setViewFromIndex],
    );

    const handleCalendarScrollEndDrag = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const targetOffset = event.nativeEvent.targetContentOffset?.x;
        if (typeof targetOffset !== "number") return;

        setViewFromIndex(resolveCalendarIndex(targetOffset));
      },
      [resolveCalendarIndex, setViewFromIndex],
    );

    const handleScrollToIndexFailed = useCallback(
      ({ index }: { index: number }) => {
        requestAnimationFrame(() => {
          calendarRef.current?.scrollToOffset({
            animated: false,
            offset: index * calendarPageWidth,
          });
        });
      },
      [calendarPageWidth],
    );

    const handleCalendarLayout = useCallback(
      (event: LayoutChangeEvent) => {
        const nextWidth = event.nativeEvent.layout.width;
        if (nextWidth <= 0) return;
        if (Math.abs(nextWidth - calendarPageWidth) < 0.5) return;

        setCalendarPageWidth(nextWidth);

        if (!mounted || mode !== "calendar") return;

        requestAnimationFrame(() => {
          calendarRef.current?.scrollToOffset({
            animated: false,
            offset: viewIndex * nextWidth,
          });
        });
      },
      [calendarPageWidth, mode, mounted, viewIndex],
    );

    const moveByMonth = useCallback(
      (delta: number) => {
        const nextIndex = clampIndex(viewIndex + delta, monthCount);
        if (nextIndex === viewIndex) return;

        setViewFromIndex(nextIndex);
        syncCalendar(nextIndex, true);
      },
      [monthCount, setViewFromIndex, syncCalendar, viewIndex],
    );

    const renderMonthItem = useCallback(
      ({ item }: { item: number }) => {
        const target = indexToMonth(item, minYear);
        const selectedDay =
          value.month === target.month && value.year === target.year ?
            value.day
          : null;

        return (
          <MonthPage
            fontFamily={fontLoaded ? "SfProRounded" : undefined}
            month={target.month}
            onSelect={handleSelectDay}
            pageWidth={calendarPageWidth}
            selectedDay={selectedDay}
            year={target.year}
          />
        );
      },
      [
        calendarPageWidth,
        handleSelectDay,
        fontLoaded,
        minYear,
        value.day,
        value.month,
        value.year,
      ],
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
                height: panelHeight,
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
                      {/* <Ionicons
                        color="#0a97fd"
                        size={22}
                        name="chevron-forward"
                      /> */}
                      <FontAwesome6
                        name="chevron-right"
                        color="#0a97fd"
                        size={15}
                      />
                    </Animated.View>
                  </Pressable>

                  <Animated.View style={[styles.navRow, navFadeStyle]}>
                    <Pressable
                      disabled={mode !== "calendar" || !canGoPrev}
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
                      disabled={mode !== "calendar" || !canGoNext}
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
                </View>

                <Animated.View
                  style={[
                    styles.stage,
                    { height: stageHeight, marginTop: STAGE_GAP },
                  ]}
                >
                  <Animated.View
                    pointerEvents={mode === "calendar" ? "auto" : "none"}
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
                    <FlatList
                      bounces={false}
                      data={monthIndexes}
                      decelerationRate={CALENDAR_DECELERATION_RATE}
                      directionalLockEnabled
                      getItemLayout={(_, index) => ({
                        index,
                        length: calendarPageWidth,
                        offset: calendarPageWidth * index,
                      })}
                      horizontal
                      initialNumToRender={4}
                      initialScrollIndex={viewIndex}
                      keyExtractor={(item) => String(item)}
                      maxToRenderPerBatch={4}
                      onLayout={handleCalendarLayout}
                      onMomentumScrollEnd={handleCalendarMomentumEnd}
                      onScrollEndDrag={handleCalendarScrollEndDrag}
                      onScrollToIndexFailed={handleScrollToIndexFailed}
                      pagingEnabled
                      ref={calendarRef}
                      renderItem={renderMonthItem}
                      scrollEnabled={mode === "calendar"}
                      showsHorizontalScrollIndicator={false}
                      style={styles.calendarPager}
                      windowSize={6}
                    />
                  </Animated.View>

                  <Animated.View
                    pointerEvents={mode === "wheel" ? "auto" : "none"}
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
});
