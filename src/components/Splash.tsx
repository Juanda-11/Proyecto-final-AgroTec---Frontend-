import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, gradients } from "../theme";

const native = Platform.OS !== "web";

/** Pantalla de bienvenida breve con el logo animado; se desvanece sola. */
export function Splash({ onDone }: { onDone: () => void }) {
  const logo = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logo, { toValue: 1, friction: 6, tension: 60, useNativeDriver: native }),
      Animated.delay(550),
      Animated.timing(out, { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: native }),
    ]).start(onDone);
  }, [logo, out, onDone]);

  return (
    <Animated.View style={[styles.wrap, { opacity: out }]} pointerEvents="none">
      <Animated.View style={{ alignItems: "center", opacity: logo, transform: [{ scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }}>
        <LinearGradient colors={gradients.lime} style={styles.logo}>
          <Ionicons name="leaf" size={46} color="#10210F" />
        </LinearGradient>
        <Text style={styles.name}>AgroTec</Text>
        <Text style={styles.tag}>Agricultura de precisión · Nariño</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", zIndex: 50 },
  logo: { width: 96, height: 96, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  name: { color: colors.text, fontSize: 34, fontWeight: "900", letterSpacing: -0.8, marginTop: 18 },
  tag: { color: colors.muted, fontSize: 13, marginTop: 6 },
});
