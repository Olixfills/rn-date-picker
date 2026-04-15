import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { SquircleView } from "~/squircle";
import { WheelPicker } from "./components/wheel-picker";
import {
  END_YEAR,
  ITEM_HEIGHT,
  MONTH_LOOP_MIDDLE,
  MONTHS,
  MONTHS_LOOPED,
  PICKER_HEIGHT,
  START_YEAR,
  YEARS,
} from "./constants";
import type { DatePickerProps } from "./types/date-picker";

export const DatePicker = memo<DatePickerProps>(
  ({
    initialMonth = new Date().getMonth(),
    initialYear = new Date().getFullYear(),
    onDateChange,
  }) => {
    const { width } = useWindowDimensions();
    const scale = Math.max(0.84, Math.min(width / 390, 1.08));

    const safeInitialMonth = Math.max(
      0,
      Math.min(initialMonth, MONTHS.length - 1),
    );
    const safeInitialYear = Math.max(
      START_YEAR,
      Math.min(initialYear, END_YEAR),
    );

    const [month, setMonth] = useState(safeInitialMonth);
    const [year, setYear] = useState(safeInitialYear);
    const [monthWheelIndex, setMonthWheelIndex] = useState(
      MONTH_LOOP_MIDDLE * MONTHS.length + safeInitialMonth,
    );

    const onDateChangeRef = useRef(onDateChange);
    onDateChangeRef.current = onDateChange;

    const isFirstRender = useRef(true);
    useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }

      onDateChangeRef.current?.(month, year);
    }, [month, year]);

    const yearIndex = year - START_YEAR;
    const cardHeight = PICKER_HEIGHT + 134 * scale;
    const cardRadius = 36 * scale;
    const contentHorizontalPadding = 18 * scale;
    const contentTopPadding = 20 * scale;
    const contentBottomPadding = 22 * scale;
    const headerMetaFontSize = 11 * scale;
    const headerFontSize = 22 * scale;
    const headerChevronSize = 18 * scale;
    const wheelStageMarginTop = 18 * scale;
    const indicatorHeight = ITEM_HEIGHT + 6 * scale;
    const indicatorHorizontalInset = 6 * scale;
    const monthColumnRightPadding = 4 * scale;
    const yearColumnLeftPadding = 2 * scale;
    const monthFontSize = 30 * scale;
    const yearFontSize = 30 * scale;
    const monthHorizontalPadding = 12 * scale;
    const yearHorizontalPadding = 16 * scale;
    const cardGlowSize = 172 * scale;
    const cardGlowOffset = -48 * scale;
    const headerMetaGap = 7 * scale;

    const handleMonthChange = useCallback((index: number) => {
      setMonth(index % MONTHS.length);
      setMonthWheelIndex(index);
    }, []);

    const handleYearChange = useCallback((index: number) => {
      setYear(START_YEAR + index);
    }, []);

    return (
      <View style={styles.frame}>
        <SquircleView
          backgroundColor="#080808"
          borderColor="rgba(255,255,255,0.14)"
          borderWidth={1}
          cornerRadius={cardRadius}
          cornerSmoothing={0.92}
          style={[styles.card, { height: cardHeight }]}
        >
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View
              style={[
                styles.cardGlow,
                {
                  backgroundColor: "rgba(70,130,255,0.18)",
                  height: cardGlowSize,
                  right: cardGlowOffset,
                  top: cardGlowOffset,
                  width: cardGlowSize,
                },
              ]}
            />
            <View
              style={[
                styles.cardGlow,
                {
                  backgroundColor: "rgba(255,255,255,0.045)",
                  bottom: -72 * scale,
                  height: 228 * scale,
                  left: -54 * scale,
                  width: 228 * scale,
                },
              ]}
            />
            <View style={styles.cardSheen} />
          </View>

          <View
            style={[
              styles.content,
              {
                paddingBottom: contentBottomPadding,
                paddingHorizontal: contentHorizontalPadding,
                paddingTop: contentTopPadding,
              },
            ]}
          >
            <View style={[styles.headerMeta, { gap: headerMetaGap }]}>
              <View style={styles.headerMetaDot} />
              <Text
                style={[
                  styles.headerMetaText,
                  { fontSize: headerMetaFontSize },
                ]}
              >
                CURRENT SELECTION
              </Text>
            </View>

            <View style={styles.header}>
              <Text style={[styles.headerText, { fontSize: headerFontSize }]}>
                {MONTHS[month]} {year}
              </Text>
              <Text
                style={[
                  styles.headerChevron,
                  {
                    fontSize: headerChevronSize,
                    lineHeight: headerChevronSize,
                    marginTop: 1.5 * scale,
                  },
                ]}
              >
                ⌄
              </Text>
            </View>

            <View
              style={[styles.wheelStage, { marginTop: wheelStageMarginTop }]}
            >
              <View
                pointerEvents="none"
                style={[
                  styles.indicatorContainer,
                  { paddingHorizontal: indicatorHorizontalInset },
                ]}
              >
                <SquircleView
                  backgroundColor="rgba(255,255,255,0.11)"
                  cornerRadius={indicatorHeight / 2}
                  cornerSmoothing={1}
                  style={[styles.indicator, { height: indicatorHeight }]}
                />
              </View>

              <View style={styles.wheels}>
                <View
                  style={[
                    styles.monthColumn,
                    { paddingRight: monthColumnRightPadding },
                  ]}
                >
                  <WheelPicker
                    fontFamily="SfProRounded"
                    fontSize={monthFontSize}
                    horizontalPadding={monthHorizontalPadding}
                    items={MONTHS_LOOPED}
                    minimumFontScale={0.82}
                    onIndexChange={handleMonthChange}
                    selectedIndex={monthWheelIndex}
                    textAlign="left"
                  />
                </View>
                <View
                  style={[
                    styles.yearColumn,
                    { paddingLeft: yearColumnLeftPadding },
                  ]}
                >
                  <WheelPicker
                    fontFamily="SfProRounded"
                    fontSize={yearFontSize}
                    horizontalPadding={yearHorizontalPadding}
                    items={YEARS}
                    onIndexChange={handleYearChange}
                    selectedIndex={yearIndex}
                    textAlign="right"
                  />
                </View>
              </View>
            </View>
          </View>
        </SquircleView>
      </View>
    );
  },
);

DatePicker.displayName = "DatePicker";

const styles = StyleSheet.create({
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.38,
    shadowRadius: 34,
  },
  cardGlow: {
    borderRadius: 999,
    position: "absolute",
  },
  cardSheen: {
    backgroundColor: "rgba(255,255,255,0.08)",
    height: 1,
    left: 20,
    opacity: 0.55,
    position: "absolute",
    right: 20,
    top: 0,
  },
  content: {
    flex: 1,
    overflow: "hidden",
  },
  frame: {
    alignSelf: "center",
    maxWidth: 720,
    width: "100%",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  headerChevron: {
    color: "#60A4FF",
    fontFamily: "SfProRounded",
    fontWeight: "700",
  },
  headerMeta: {
    alignItems: "center",
    flexDirection: "row",
  },
  headerMetaDot: {
    backgroundColor: "#62A1FF",
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  headerMetaText: {
    color: "rgba(226,236,255,0.62)",
    fontFamily: "SfProRounded",
    fontWeight: "600",
    letterSpacing: 1.35,
  },
  headerText: {
    color: "#60A4FF",
    fontFamily: "SfProRounded",
    fontWeight: "700",
    letterSpacing: -0.9,
  },
  indicator: {
    backgroundColor: "transparent",
    borderColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
  },
  indicatorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
  },
  monthColumn: {
    flex: 1.34,
  },
  wheelStage: {
    flex: 1,
    justifyContent: "center",
  },
  wheels: {
    flexDirection: "row",
    height: PICKER_HEIGHT,
  },
  yearColumn: {
    flex: 0.66,
  },
});
