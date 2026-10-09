import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import type { Risk, SensorKey } from "../data/types";
import { SENSOR_META } from "../iot/simulator";
import { colors, font, radius } from "../theme";
import { Pill, ProgressBar, riskColor } from "./ui";

export function SensorCard({ sensor, value, risk }: { sensor: SensorKey; value: number; risk: Risk }) {
  const meta = SENSOR_META[sensor];
  const flash = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(flash, { toValue: 0.55, duration: 120, useNativeDriver: Platform.OS !== "web" }),
      Animated.timing(flash, { toValue: 1, duration: 420, useNativeDriver: Platform.OS !== "web" }),
    ]).start();
  }, [value, flash]);
  const color = riskColor(risk);
  const pct = (value - meta.min) / (meta.max - meta.min);
  return (
    <View style={[styles.card, { borderColor: risk === "BAJO" ? colors.border : color + "77" }]}>
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: color + "1F" }]}>
          <Ionicons name={meta.icon as keyof typeof Ionicons.glyphMap} size={19} color={color} />
        </View>
        <Pill risk={risk} />
      </View>
      <Text style={styles.label}>{meta.label}</Text>
      <Animated.View style={[styles.valueRow, { opacity: flash }]}>
        <Text style={styles.value}>{value.toFixed(meta.decimals)}</Text>
        <Text style={styles.unit}>{meta.unit}</Text>
      </Animated.View>
      <ProgressBar value={pct} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%", backgroundColor: colors.panel, borderWidth: 1, borderRadius: radius.md, padding: 13 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  label: { color: colors.muted, fontSize: font.xs + 0.5, marginTop: 12 },
  valueRow: { flexDirection: "row", alignItems: "baseline", marginVertical: 3 },
  value: { color: colors.text, fontSize: 29, fontWeight: "900" },
  unit: { color: colors.muted, fontSize: font.sm, marginLeft: 4 },
});
