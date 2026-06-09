import React, { useState, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DatePickerDropdown, formatDateTime } from "@/index";
import type { DateValue } from "@/index";

const FONT = "SfProRounded";

export default function Index() {
  const today = useMemo(() => new Date(), []);
  const initialValue = useMemo<DateValue>(() => ({
    day: today.getDate(),
    month: today.getMonth(),
    year: today.getFullYear(),
    hour: today.getHours(),
    minute: today.getMinutes(),
  }), [today]);

  // States for different usage examples
  const [dateOnly, setDateOnly] = useState<DateValue>(initialValue);
  const [time12, setTime12] = useState<DateValue>(initialValue);
  const [time24, setTime24] = useState<DateValue>(initialValue);
  const [dateTime12, setDateTime12] = useState<DateValue>(initialValue);
  const [dateTime24, setDateTime24] = useState<DateValue>(initialValue);
  const [clampedVal, setClampedDate] = useState<DateValue>(initialValue);

  // Boundary limits for clamped example (clamped between today and +5 days, hours 08:00 to 20:00)
  const maxD = useMemo(() => {
    const d = new Date();
    d.setDate(today.getDate() + 5);
    return d;
  }, [today]);

  const minDateLimit = initialValue;
  const maxDateLimit = useMemo<DateValue>(() => ({
    day: maxD.getDate(),
    month: maxD.getMonth(),
    year: maxD.getFullYear(),
    hour: 20,
    minute: 0,
  }), [maxD]);

  const minTimeLimit = { hour: 8, minute: 0 };
  const maxTimeLimit = { hour: 20, minute: 0 };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Date & Time Pickers</Text>
          <Text style={styles.subtitle}>iOS-Styled Component Showcase</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Examples</Text>
          <View style={styles.card}>
            {/* 1. Date Only Mode */}
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Date Only</Text>
                <Text style={styles.rowValue}>{formatDateTime(dateOnly, "DD MMMM YYYY")}</Text>
              </View>
              <DatePickerDropdown.Root onChange={setDateOnly} value={dateOnly} mode="date">
                <DatePickerDropdown.Trigger />
                <DatePickerDropdown.Content side="bottom" />
              </DatePickerDropdown.Root>
            </View>

            {/* 2. Standalone 12-Hour Time */}
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Time (12-Hour AM/PM)</Text>
                <Text style={styles.rowValue}>{formatDateTime(time12, "hh:mm A")}</Text>
              </View>
              <DatePickerDropdown.Root onChange={setTime12} value={time12} mode="time" is24Hour={false}>
                <DatePickerDropdown.Trigger />
                <DatePickerDropdown.Content side="bottom" />
              </DatePickerDropdown.Root>
            </View>

            {/* 3. Standalone 24-Hour Time */}
            <View style={[styles.row, styles.lastRow]}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Time (24-Hour)</Text>
                <Text style={styles.rowValue}>{formatDateTime(time24, "HH:mm")}</Text>
              </View>
              <DatePickerDropdown.Root onChange={setTime24} value={time24} mode="time" is24Hour={true}>
                <DatePickerDropdown.Trigger />
                <DatePickerDropdown.Content side="bottom" />
              </DatePickerDropdown.Root>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Combined Datetime Examples</Text>
          <View style={styles.card}>
            {/* 4. Combined 12-Hour Datetime */}
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Datetime (12-Hour)</Text>
                <Text style={styles.rowValue}>{formatDateTime(dateTime12, "DD/MM/YY, hh:mm A")}</Text>
              </View>
              <DatePickerDropdown.Root onChange={setDateTime12} value={dateTime12} mode="datetime" is24Hour={false}>
                <DatePickerDropdown.Trigger />
                <DatePickerDropdown.Content side="bottom" />
              </DatePickerDropdown.Root>
            </View>

            {/* 5. Combined 24-Hour Datetime */}
            <View style={[styles.row, styles.lastRow]}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Datetime (24-Hour)</Text>
                <Text style={styles.rowValue}>{formatDateTime(dateTime24, "YYYY-MM-DD HH:mm")}</Text>
              </View>
              <DatePickerDropdown.Root onChange={setDateTime24} value={dateTime24} mode="datetime" is24Hour={true}>
                <DatePickerDropdown.Trigger />
                <DatePickerDropdown.Content side="bottom" />
              </DatePickerDropdown.Root>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Boundary Controls & Limits</Text>
          <View style={styles.card}>
            {/* 6. Clamped Datetime Picker */}
            <View style={[styles.row, styles.lastRow]}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Clamped Picker</Text>
                <Text style={styles.rowValue}>{formatDateTime(clampedVal, "DD/MM/YY, hh:mm A")}</Text>
                <Text style={styles.rowCaption}>Limited between today and +5 days, hours 08:00 to 20:00</Text>
              </View>
              <DatePickerDropdown.Root
                onChange={setClampedDate}
                value={clampedVal}
                minDate={minDateLimit}
                maxDate={maxDateLimit}
                minTime={minTimeLimit}
                maxTime={maxTimeLimit}
                mode="datetime"
                is24Hour={false}
              >
                <DatePickerDropdown.Trigger />
                <DatePickerDropdown.Content side="top" />
              </DatePickerDropdown.Root>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const BG = "#000000";
const CARD_BG = "#1C1C1E";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "rgba(255,255,255,0.6)";
const BORDER_SUBTLE = "rgba(255,255,255,0.06)";

const styles = StyleSheet.create({
  safe: {
    backgroundColor: BG,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
    marginTop: 8,
  },
  title: {
    color: TEXT_PRIMARY,
    fontFamily: FONT,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: TEXT_SECONDARY,
    fontFamily: FONT,
    fontSize: 15,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: TEXT_SECONDARY,
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: BORDER_SUBTLE,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowInfo: {
    flex: 1,
    paddingRight: 16,
  },
  rowLabel: {
    color: TEXT_PRIMARY,
    fontFamily: FONT,
    fontSize: 16,
    fontWeight: "600",
  },
  rowValue: {
    color: "#0a97fd",
    fontFamily: FONT,
    fontSize: 14,
    marginTop: 2,
  },
  rowCaption: {
    color: "rgba(255,255,255,0.35)",
    fontFamily: FONT,
    fontSize: 11,
    marginTop: 4,
  },
});
