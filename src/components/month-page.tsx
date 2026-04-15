import React, { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  CELL_HEIGHT,
  MAX_CALENDAR_ROWS,
  MAX_DISTRIBUTED_ROW_GAP,
} from "@/constants";
import { MonthPageProps } from "@/types/date-picker";
import { buildGrid } from "../utils/calendar";

export const MonthPage = memo<MonthPageProps>(
  ({ fontFamily, month, onSelect, pageWidth, selectedDay, year }) => {
    const weeks = useMemo(() => {
      const grid = buildGrid(year, month);
      const rows: (number | null)[][] = [];

      for (let index = 0; index < grid.length; index += 7) {
        rows.push(grid.slice(index, index + 7));
      }

      return rows;
    }, [month, year]);

    const pageHeight = MAX_CALENDAR_ROWS * CELL_HEIGHT;
    const columnWidth = pageWidth / 7;
    const extraRowSpace = Math.max(0, pageHeight - weeks.length * CELL_HEIGHT);
    const rowGap =
      weeks.length > 1 ?
        Math.min(extraRowSpace / (weeks.length - 1), MAX_DISTRIBUTED_ROW_GAP)
      : extraRowSpace;

    return (
      <View
        style={[styles.monthPage, { height: pageHeight, width: pageWidth }]}
      >
        {weeks.map((week, weekIndex) => (
          <View
            key={`w-${weekIndex}`}
            style={[
              styles.weekRow,
              weekIndex < weeks.length - 1 && { marginBottom: rowGap },
            ]}
          >
            {week.map((day, dayIndex) => {
              if (day === null) {
                return (
                  <View
                    key={`e-${weekIndex}-${dayIndex}`}
                    style={[
                      styles.cell,
                      { height: CELL_HEIGHT, width: columnWidth },
                    ]}
                  />
                );
              }

              const selected = day === selectedDay;

              return (
                <Pressable
                  key={`d-${year}-${month}-${day}`}
                  onPress={() => onSelect(day, month, year)}
                  style={[
                    styles.cell,
                    { height: CELL_HEIGHT, width: columnWidth },
                  ]}
                >
                  {selected ?
                    <View style={styles.selectedBubble}>
                      <Text style={[styles.selectedDayText, { fontFamily }]}>
                        {day}
                      </Text>
                    </View>
                  : <Text style={[styles.dayText, { fontFamily }]}>{day}</Text>}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    );
  },
);

MonthPage.displayName = "MonthPage";

const styles = StyleSheet.create({
  cell: {
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    color: "#F2F2F7",
    fontSize: 20,
    fontVariant: ["tabular-nums"],
    fontWeight: "400",
  },
  monthPage: {
    overflow: "hidden",
  },
  selectedBubble: {
    alignItems: "center",
    backgroundColor: "#142a3ba4",
    borderRadius: 999,
    height: 45,
    justifyContent: "center",
    width: 45,
  },
  selectedDayText: {
    color: "#08a0ff",
    fontSize: 20,
    fontVariant: ["tabular-nums"],
    fontWeight: "bold",
  },
  weekRow: {
    flexDirection: "row",
  },
});
