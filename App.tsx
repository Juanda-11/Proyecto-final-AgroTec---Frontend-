import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { FarmScreen } from "./src/screens/FarmScreen";
import { AssistantScreen } from "./src/screens/AssistantScreen";
import { RoutesScreen } from "./src/screens/RoutesScreen";
import { FarmProvider } from "./src/store/FarmContext";
import { checkBackend } from "./src/services/api";
import { colors, gradients } from "./src/theme";

type Tab = "home" | "farm" | "ai" | "routes";
const TABS: Array<{ key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap; active: keyof typeof Ionicons.glyphMap }> = [
  { key: "home", label: "Inicio", icon: "pulse-outline", active: "pulse" },
  { key: "farm", label: "Cultivos", icon: "leaf-outline", active: "leaf" },
  { key: "ai", label: "AgroIA", icon: "sparkles-outline", active: "sparkles" },
  { key: "routes", label: "Rutas", icon: "git-network-outline", active: "git-network" },
];

function Shell() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("home");
  const [backend, setBackend] = useState<"gemini" | "reglas" | "offline">("offline");
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => { checkBackend().then(setBackend); }, []);

  const go = (t: Tab) => {
    if (t === tab) return;
    Animated.timing(fade, { toValue: 0, duration: 110, useNativeDriver: Platform.OS !== "web" }).start(() => {
      setTab(t);
      Animated.timing(fade, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== "web" }).start();
    });
  };

  return (
    <LinearGradient colors={[colors.bg, "#081A12", colors.bg]} style={styles.app}>
      <StatusBar style="light" />
      <Animated.View style={{ flex: 1, paddingTop: insets.top, opacity: fade }}>
        {tab === "home" && <DashboardScreen backend={backend} />}
        {tab === "farm" && <FarmScreen />}
        {tab === "ai" && <AssistantScreen backend={backend} />}
        {tab === "routes" && <RoutesScreen />}
      </Animated.View>
      <View style={[styles.bar, { bottom: Math.max(insets.bottom, 10) }]}>
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => go(t.key)} style={styles.tabBtn} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={t.label}>
              {on ? <LinearGradient colors={gradients.lime} style={styles.tabIcon}><Ionicons name={t.active} size={21} color="#10210F" /></LinearGradient>
                  : <View style={styles.tabIcon}><Ionicons name={t.icon} size={22} color="#7C9588" /></View>}
              <Text style={[styles.tabLabel, on && { color: colors.text }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </LinearGradient>
  );
}

/** App solo móvil: en pantallas anchas (web) se muestra dentro de un marco de teléfono. */
export default function App() {
  const { width } = useWindowDimensions();
  const framed = Platform.OS === "web" && width > 520;
  return (
    <SafeAreaProvider>
      <FarmProvider>
        {framed ? (
          <View style={styles.desktop}>
            <View style={styles.phone}><Shell /></View>
            <Text style={styles.hint}>AgroTec está diseñada para móvil · ábrela desde tu celular o reduce la ventana</Text>
          </View>
        ) : (
          <Shell />
        )}
      </FarmProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1 },
  desktop: { flex: 1, backgroundColor: "#020705", alignItems: "center", justifyContent: "center", padding: 16 },
  phone: { width: 410, height: "92%", maxHeight: 880, borderRadius: 38, overflow: "hidden", borderWidth: 8, borderColor: "#16251D" },
  hint: { color: colors.faint, fontSize: 12, marginTop: 14 },
  bar: { position: "absolute", left: 12, right: 12, height: 72, borderRadius: 26, backgroundColor: "#0B1912F2", borderWidth: 1, borderColor: "#22463A", flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  tabBtn: { alignItems: "center", justifyContent: "center", flex: 1, gap: 3 },
  tabIcon: { width: 42, height: 32, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  tabLabel: { color: "#7C9588", fontSize: 11, fontWeight: "700" },
});
