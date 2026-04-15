
# expo-ios-like-date-picker

A pretty date picker that looks and feels like the one on iOS but for Android.

## ✨ Features

- 🎡 Wheel picker with haptic feedback & sound
- 📅 Calendar grid for day selection
- 🔮 Glassmorphism & smooth animations
- 🧩 TypeScript-ready

---

## ⚙️ Installation

```bash
git clone https://github.com/rit3zh/expo-ios-like-date-picker
cd expo-ios-like-date-picker
bun start
```

---

## 🎥 Preview

<!-- TODO: add video -->

https://github.com/user-attachments/assets/ed77e2f1-ceff-4ae5-afdf-3f40b2fbb9df

---

## 🚀 Usage

```tsx
import { DatePickerDropdown, type DateValue } from "@/src";

const [date, setDate] = useState<DateValue>({
  day: 15,
  month: 3,
  year: 2026,
});

<DatePickerDropdown.Root value={date} onChange={setDate}>
  <DatePickerDropdown.Trigger style={styles.trigger}>
    <Text>Pick a date</Text>
  </DatePickerDropdown.Trigger>
  <DatePickerDropdown.Content side="bottom" align="center" />
</DatePickerDropdown.Root>;
```

---

## Stack

Expo 55 · React Native 0.83 · Reanimated 4 · Skia · Expo Router

---

> [!WARNING]
> This project is **not optimized** — it needs performance improvements and currently **only works on Android**. iOS is not supported yet (c'mon use the native date picker for iOS).
