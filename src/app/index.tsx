import type { DateValue } from "@/context";
import { DatePickerDropdown } from "@/dropdown";
import { toDateValue } from "@/helpers";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FONT = "SfProRounded";

const PICKUP_LOCATION = "SFO International Airport";
const DROPOFF_LOCATION = "Union Square, SF";

function formatShortDate(d: DateValue) {
  const dd = String(d.day).padStart(2, "0");
  const mm = String(d.month + 1).padStart(2, "0");
  const yy = String(d.year).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function Chip({ icon, label }: { icon?: IoniconName; label: string }) {
  return (
    <View style={styles.chip}>
      {icon ?
        <Ionicons
          name={icon}
          size={13}
          color="rgba(255,255,255,0.7)"
          style={{ marginRight: 6 }}
        />
      : null}
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

export default function Index() {
  const today = new Date();
  const [fromDate, setFromDate] = useState<DateValue>(toDateValue(today));
  const [toDate, setToDate] = useState<DateValue>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return toDateValue(d);
  });

  const fromLabel = useMemo(() => formatShortDate(fromDate), [fromDate]);
  const toLabel = useMemo(() => formatShortDate(toDate), [toDate]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Image
              source={{
                uri: "https://i.pinimg.com/1200x/18/78/37/18783753f9ec9084a25a731580357b84.jpg",
              }}
              style={{ height: "100%", width: "100%" }}
            />
          </View>

          <View style={styles.searchPill}>
            <Feather name="search" size={18} color="#b8b8b8" />
            <Text style={styles.searchPlaceholder}>Find </Text>
            <Text style={styles.searchHighlight}>Best Car</Text>
          </View>

          <Pressable style={styles.bellButton} hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            <View style={styles.bellDot} />
          </Pressable>
        </View>

        <Text style={styles.title}>Search for a car</Text>
        <Text style={styles.subtitle}>
          Find car hire at over 32K+ locations
        </Text>

        <View style={styles.inputField}>
          <View style={styles.markerDotFilled} />
          <Text style={styles.inputValue} numberOfLines={1}>
            {PICKUP_LOCATION}
          </Text>
          <Ionicons name="location-outline" size={20} color="#FFFFFF" />
        </View>

        <View style={styles.inputField}>
          <View style={styles.markerDotHollow} />
          <Text style={styles.inputValue} numberOfLines={1}>
            {DROPOFF_LOCATION}
          </Text>
          <Ionicons name="location-outline" size={20} color="#FFFFFF" />
        </View>

        <View style={styles.dateCard}>
          <View style={styles.dateCol}>
            <DatePickerDropdown.Root onChange={setFromDate} value={fromDate}>
              <DatePickerDropdown.Trigger style={styles.dateTrigger}>
                <Text style={styles.dateLabel}>From</Text>
                <View style={styles.dateValueRow}>
                  <Text style={styles.dateValue}>{fromLabel}</Text>
                  <Text style={styles.timeValue}>10:00</Text>
                  <Ionicons
                    name="chevron-down"
                    size={12}
                    color="rgba(255,255,255,0.5)"
                    style={{ marginLeft: 2 }}
                  />
                </View>
              </DatePickerDropdown.Trigger>
              <DatePickerDropdown.Content side="bottom" />
            </DatePickerDropdown.Root>
          </View>

          <View style={styles.swapButton}>
            <Ionicons
              name="swap-horizontal"
              size={16}
              color="rgba(255,255,255,0.8)"
            />
          </View>

          <View style={[styles.dateCol, { alignItems: "flex-end" }]}>
            <DatePickerDropdown.Root onChange={setToDate} value={toDate}>
              <DatePickerDropdown.Trigger style={styles.dateTrigger}>
                <Text style={styles.dateLabel}>To</Text>
                <View style={styles.dateValueRow}>
                  <Text style={styles.dateValue}>{toLabel}</Text>
                  <Text style={styles.timeValue}>10:00</Text>
                  <Ionicons
                    name="chevron-down"
                    size={12}
                    color="rgba(255,255,255,0.5)"
                    style={{ marginLeft: 2 }}
                  />
                </View>
              </DatePickerDropdown.Trigger>
              <DatePickerDropdown.Content side="bottom" />
            </DatePickerDropdown.Root>
          </View>
        </View>

        <View style={styles.ageRow}>
          <Text style={styles.ageText}>Driver&apos;s Age 30-55</Text>
          <Pressable hitSlop={8}>
            <Text style={styles.changeLink}>Change</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.searchButton,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Most Popular Car</Text>
          <Pressable hitSlop={8}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        <View style={styles.carCard}>
          <View style={styles.carBanner}>
            <View style={styles.carBannerLeft}>
              <Ionicons name="location" size={13} color="#2F4D1E" />
              <Text style={styles.carBannerText}>
                <Text style={styles.carBannerBold}>200 m</Text> Nearest to you
              </Text>
            </View>
            <Pressable style={styles.carBannerRight} hitSlop={6}>
              <Text style={styles.carBannerDetail}>Detail</Text>
              <Ionicons name="chevron-forward" size={13} color="#2F4D1E" />
            </Pressable>
          </View>

          <View style={styles.carImageStage}>
            <Image
              source={require("@/assets/vehicle/tesla.png")}
              style={styles.carImage}
              contentFit="contain"
            />
          </View>

          <View style={styles.carInfoRow}>
            <View>
              <Text style={styles.carBrand}>Tesla</Text>
              <Text style={styles.carModelName}>Model 3</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <View style={styles.carPriceRow}>
                <Text style={styles.carPrice}>$85</Text>
                <Text style={styles.carPriceUnit}>/day</Text>
              </View>
            </View>
          </View>

          <View style={styles.chipsWrap}>
            <Chip icon="speedometer-outline" label="250 kmh" />
            <Chip icon="cog-outline" label="Automatic" />
            <Chip icon="flash-outline" label="Electric" />
            <Chip icon="people-outline" label="5 Seats" />
            <Chip icon="car-sport-outline" label="Sedan" />
            <Chip label="+2 Etc" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const BG = "#000000";
const CARD_BG = "#141417";
const CAR_CARD_BG = "#17181B";
const IMAGE_STAGE_BG = "#1E2024";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "rgba(255,255,255,0.55)";
const TEXT_TERTIARY = "rgba(255,255,255,0.35)";
const BORDER_SUBTLE = "rgba(255,255,255,0.06)";
const LINK_BLUE = "#4A8CFF";
const SEARCH_GREEN = "#D9EE8B";
const DARK_GREEN_TEXT = "#2F4D1E";

const styles = StyleSheet.create({
  safe: {
    backgroundColor: BG,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 20,
    marginBottom: 24,
    marginTop: 4,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderColor: BORDER_SUBTLE,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    overflow: "hidden",
    width: 44,
  },
  searchPill: {
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderColor: BORDER_SUBTLE,
    borderRadius: 26,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    height: 46,
    paddingHorizontal: 16,
  },
  searchPlaceholder: {
    color: TEXT_SECONDARY,
    fontFamily: FONT,
    fontSize: 15,
    marginLeft: 14,
  },
  searchHighlight: {
    color: TEXT_PRIMARY,
    fontFamily: FONT,
    fontSize: 15,
  },
  bellButton: {
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderColor: BORDER_SUBTLE,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  bellDot: {
    backgroundColor: "#FF453A",
    borderColor: CARD_BG,
    borderRadius: 4,
    borderWidth: 1.5,
    height: 9,
    position: "absolute",
    right: 11,
    top: 11,
    width: 9,
  },
  title: {
    color: TEXT_PRIMARY,
    fontFamily: FONT,
    fontSize: 26,
    letterSpacing: -0.6,
    marginTop: 4,
  },
  subtitle: {
    color: TEXT_SECONDARY,
    fontFamily: FONT,
    fontSize: 15,
    marginBottom: 22,
    marginTop: 6,
  },
  inputField: {
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderColor: BORDER_SUBTLE,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    height: 60,
    marginBottom: 12,
    paddingHorizontal: 18,
  },
  markerDotFilled: {
    backgroundColor: "#7CD17B",
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  markerDotHollow: {
    borderColor: "#FF6A5B",
    borderRadius: 5,
    borderWidth: 2,
    height: 10,
    width: 10,
  },
  inputValue: {
    color: TEXT_PRIMARY,
    flex: 1,
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  dateCard: {
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderColor: BORDER_SUBTLE,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    height: 78,
    marginTop: 2,
    paddingHorizontal: 18,
  },
  dateCol: {
    flex: 1,
    justifyContent: "center",
  },
  dateTrigger: {
    alignItems: "flex-start",
  },
  dateLabel: {
    color: TEXT_TERTIARY,
    fontFamily: FONT,
    fontSize: 13,
    marginBottom: 6,
  },
  dateValueRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  dateValue: {
    color: TEXT_PRIMARY,
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  timeValue: {
    color: TEXT_PRIMARY,
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  swapButton: {
    alignItems: "center",
    backgroundColor: "#1F2024",
    borderColor: BORDER_SUBTLE,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    marginHorizontal: 8,
    width: 36,
    top: 10,
    right: 5,
  },
  ageRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  ageText: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: FONT,
    fontSize: 14,
  },
  changeLink: {
    color: LINK_BLUE,
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: "600",
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: SEARCH_GREEN,
    borderRadius: 22,
    height: 52,
    justifyContent: "center",
    marginTop: 22,
    shadowColor: "#8FBD2A",
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  searchButtonText: {
    color: DARK_GREEN_TEXT,
    fontFamily: FONT,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
  },
  sectionTitle: {
    color: TEXT_PRIMARY,
    fontFamily: FONT,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  seeAll: {
    color: TEXT_SECONDARY,
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: "500",
  },
  carCard: {
    backgroundColor: CAR_CARD_BG,
    borderColor: BORDER_SUBTLE,
    borderRadius: 26,
    borderWidth: 1,
    marginTop: 14,
    overflow: "hidden",
    padding: 14,
  },
  carBanner: {
    alignItems: "center",
    backgroundColor: SEARCH_GREEN,
    borderRadius: 14,
    flexDirection: "row",
    height: 42,
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  carBannerLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  carBannerText: {
    color: DARK_GREEN_TEXT,
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: "500",
  },
  carBannerBold: {
    fontFamily: FONT,
    fontWeight: "700",
  },
  carBannerRight: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
  },
  carBannerDetail: {
    color: DARK_GREEN_TEXT,
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: "600",
  },
  carImageStage: {
    alignItems: "center",
    backgroundColor: IMAGE_STAGE_BG,
    borderRadius: 18,
    height: 168,
    justifyContent: "center",
    marginTop: 10,
    overflow: "hidden",
  },
  carImage: {
    height: "100%",
    width: "80%",
  },
  carInfoRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingHorizontal: 4,
  },
  carBrand: {
    color: TEXT_SECONDARY,
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: "500",
  },
  carModelName: {
    color: TEXT_PRIMARY,
    fontFamily: FONT,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  carPriceRow: {
    alignItems: "baseline",
    flexDirection: "row",
  },
  carPrice: {
    color: TEXT_PRIMARY,
    fontFamily: FONT,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  carPriceUnit: {
    color: TEXT_SECONDARY,
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 2,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 2,
  },
  chip: {
    alignItems: "center",
    backgroundColor: "#1E2024",
    borderColor: BORDER_SUBTLE,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    height: 34,
    paddingHorizontal: 12,
  },
  chipText: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: -0.1,
  },
});
