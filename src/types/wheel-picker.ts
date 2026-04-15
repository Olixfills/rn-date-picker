import type { SharedValue } from "react-native-reanimated";

type WheelTextAlign = "left" | "right" | "center";
interface IPickerItem {
  fontFamily?: string;
  fontSize: number;
  halfCount: number;
  horizontalPadding: number;
  index: number;
  itemHeight: number;
  label: string;
  minimumFontScale: number;
  radius: number;
  radiusRel: number;
  textAlign: WheelTextAlign;
  translateY: SharedValue<number>;
}

interface IMaskContent {
  fontFamily?: string;
  fontSize: number;
  halfCount: number;
  horizontalPadding: number;
  items: readonly string[];
  itemHeight: number;
  minimumFontScale: number;
  radius: number;
  radiusRel: number;
  textAlign: WheelTextAlign;
  translateY: SharedValue<number>;
}

interface IWheelPicker {
  activeTextColor?: string;
  fontFamily?: string;
  fontSize?: number;
  horizontalPadding?: number;
  inactiveTextColor?: string;
  itemHeight?: number;
  items: readonly string[];
  minimumFontScale?: number;
  onIndexChange: (index: number) => void;
  onIndexPreviewChange?: (index: number) => void;
  selectedIndex: number;
  textAlign?: WheelTextAlign;
  visibleCount?: number;
}

interface IWheelItem {
  fontFamily?: string;
  index: number;
  label: string;
  scrollY: SharedValue<number>;
  textAlign?: WheelTextAlign;
}

export type {
  IMaskContent,
  IPickerItem,
  IWheelItem,
  IWheelPicker,
  WheelTextAlign,
};
