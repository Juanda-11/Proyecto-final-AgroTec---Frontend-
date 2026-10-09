import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from "react-native-svg";
import { colors, font, gradients, radius } from "../theme";
import type { Risk } from "../data/types";

const native = Platform.OS !== "web";

export const riskColor = (r: Risk) => (r === "ALTO" ? colors.danger : r === "MEDIO" ? colors.warning : colors.lime);

/** Aparece con fundido + desplazamiento; `delay` permite escalonar listas. */
export function FadeIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 480, delay, easing: Easing.out(Easing.cubic), useNativeDriver: native }).start();
  }, [v, delay]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Pulso suave continuo (indicador "en vivo"). */
export function Pulse({ size = 8, color = colors.lime }: { size?: number; color?: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: native }));
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <View style={{ width: size * 2.6, height: size * 2.6, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute", width: size * 2.6, height: size * 2.6, borderRadius: size * 1.3, backgroundColor: color,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
        }}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

export function Card({ children, style, glow }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; glow?: boolean }) {
  return (
    <LinearGradient colors={gradients.card} style={[styles.card, glow && styles.glow, style]}>
      {children}
    </LinearGradient>
  );
}

export function Title({ children, sub, right }: { children: string; sub?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.titleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{children}</Text>
        {sub ? <Text style={styles.sectionSub}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Pill({ risk, label }: { risk: Risk; label?: string }) {
  const c = riskColor(risk);
  return (
    <View style={[styles.pill, { borderColor: c + "66", backgroundColor: c + "18" }]}>
      <View style={[styles.pillDot, { backgroundColor: c }]} />
      <Text style={[styles.pillText, { color: c }]}>{label ?? risk}</Text>
    </View>
  );
}

export function Tag({ text, color = colors.cyan }: { text: string; color?: string }) {
  return (
    <View style={[styles.tag, { borderColor: color + "55", backgroundColor: color + "14" }]}>
      <Text style={[styles.tagText, { color }]}>{text}</Text>
    </View>
  );
}

/** Botón con degradado y animación de pulsación. */
export function Button({
  label, onPress, icon, variant = "lime", disabled, loading, style,
}: {
  label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; variant?: "lime" | "emerald" | "ghost";
  disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (x: number) => Animated.spring(s, { toValue: x, friction: 6, tension: 220, useNativeDriver: native }).start();
  const dark = variant === "lime";
  const content = (
    <View style={styles.btnInner}>
      {icon ? <Ionicons name={icon} size={18} color={variant === "ghost" ? colors.lime : dark ? "#10210F" : colors.text} /> : null}
      <Text style={[styles.btnText, { color: variant === "ghost" ? colors.text : dark ? "#10210F" : colors.text }]}>
        {loading ? "Pensando…" : label}
      </Text>
    </View>
  );
  return (
    <Animated.View style={[{ transform: [{ scale: s }], opacity: disabled ? 0.5 : 1 }, style]}>
      <Pressable
        onPress={onPress} disabled={disabled || loading} onPressIn={() => to(0.96)} onPressOut={() => to(1)}
        accessibilityRole="button" accessibilityLabel={label}
      >
        {variant === "ghost" ? (
          <View style={[styles.btn, styles.btnGhost]}>{content}</View>
        ) : (
          <LinearGradient colors={variant === "lime" ? gradients.lime : gradients.emerald} style={styles.btn}>
            {content}
          </LinearGradient>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function IconButton({ icon, onPress, disabled, label }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean; label: string }) {
  return (
    <Pressable
      onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }, disabled && { opacity: 0.35 }]}
    >
      <Ionicons name={icon} size={20} color={colors.lime} />
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: !!selected }}>
      <Text style={[styles.chipText, selected && { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

/** Barra de progreso animada. */
export function ProgressBar({ value, color = colors.lime }: { value: number; color?: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: Math.max(0, Math.min(1, value)), duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [v, value]);
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { backgroundColor: color, width: v.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
    </View>
  );
}

/** Minigráfico de línea con área degradada. */
export function Sparkline({ data, width = 300, height = 70, color = colors.lime, extra = [] }: { data: number[]; width?: number; height?: number; color?: string; extra?: number[] }) {
  if (data.length < 2) return <View style={{ height }} />;
  const all = [...data, ...extra];
  const lo = Math.min(...all), hi = Math.max(...all);
  const span = hi - lo || 1;
  const step = width / (all.length - 1);
  const pt = (v: number, i: number) => `${(i * step).toFixed(1)},${(height - 6 - ((v - lo) / span) * (height - 12)).toFixed(1)}`;
  const main = data.map((v, i) => pt(v, i));
  const line = "M" + main.join(" L");
  const area = `${line} L${((data.length - 1) * step).toFixed(1)},${height} L0,${height} Z`;
  const pred = extra.length ? "M" + [data.length - 1, ...extra.map((_, i) => data.length + i)].map((idx, k) => pt(k === 0 ? data[data.length - 1]! : extra[k - 1]!, idx)).join(" L") : "";
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <Defs>
        <SvgGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.35" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </SvgGradient>
      </Defs>
      <Path d={area} fill="url(#sg)" />
      <Path d={line} stroke={color} strokeWidth={2.4} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {pred ? <Path d={pred} stroke={colors.cyan} strokeWidth={2.2} strokeDasharray="5 5" fill="none" /> : null}
    </Svg>
  );
}

export function ScreenHeader({ eyebrow, title, subtitle, right }: { eyebrow: string; title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
      </View>
      {right ?? (
        <LinearGradient colors={gradients.lime} style={styles.logo}>
          <Ionicons name="leaf" size={22} color="#10210F" />
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 14 },
  glow: { borderColor: "#2F7A52", shadowColor: colors.emerald, shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, marginTop: 6 },
  sectionTitle: { color: colors.text, fontSize: font.lg, fontWeight: "800" },
  sectionSub: { color: colors.muted, fontSize: font.xs + 0.5, marginTop: 2 },
  pill: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4, gap: 5 },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 10.5, fontWeight: "900", letterSpacing: 0.4 },
  tag: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3, alignSelf: "flex-start" },
  tagText: { fontSize: 10.5, fontWeight: "800", letterSpacing: 0.3 },
  btn: { minHeight: 52, borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  btnGhost: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnText: { fontSize: font.md, fontWeight: "800" },
  iconBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel, alignItems: "center", justifyContent: "center" },
  chip: { paddingHorizontal: 14, paddingVertical: 11, minHeight: 44, justifyContent: "center", borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel },
  chipOn: { backgroundColor: "#1D5A3C", borderColor: "#4C9D6F" },
  chipText: { color: colors.muted, fontSize: font.sm, fontWeight: "700" },
  track: { height: 7, borderRadius: 4, backgroundColor: "#1B3226", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 18, gap: 12 },
  eyebrow: { color: colors.lime, fontSize: 11, fontWeight: "800", letterSpacing: 1.4, marginBottom: 4 },
  headerTitle: { color: colors.text, fontSize: font.xxl, fontWeight: "900", letterSpacing: -0.7 },
  headerSub: { color: colors.muted, fontSize: font.sm, marginTop: 3 },
  logo: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
