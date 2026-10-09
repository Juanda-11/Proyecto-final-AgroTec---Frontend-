import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SensorCard } from "../components/SensorCard";
import { Button, Card, Chip, FadeIn, IconButton, Pill, Pulse, ScreenHeader, Sparkline, Tag, Title, riskColor } from "../components/ui";
import { CROPS } from "../data/farm";
import type { Assessment, ForecastResult } from "../data/types";
import { SENSOR_ORDER, sensorRisk } from "../iot/simulator";
import * as api from "../services/api";
import { useFarm } from "../store/FarmContext";
import { colors, font, gradients, radius } from "../theme";

const fmtTime = (t: number) => new Date(t).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export function DashboardScreen({ backend }: { backend: "gemini" | "reglas" | "offline" }) {
  const f = useFarm();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [fc, setFc] = useState<ForecastResult | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState<"analyze" | "forecast" | "summary" | null>(null);

  const shown = f.history.current ?? f.reading;
  const risks = SENSOR_ORDER.map((k) => sensorRisk(k, shown[k], f.crop));
  const worst = risks.includes("ALTO") ? "ALTO" : risks.includes("MEDIO") ? "MEDIO" : "BAJO";
  const viewingPast = f.history.hasNext;

  useEffect(() => { setAssessment(null); }, [f.crop]);

  const run = async (kind: "analyze" | "forecast" | "summary") => {
    setBusy(kind);
    try {
      if (kind === "analyze") setAssessment(await api.analyze(f.reading, f.crop));
      if (kind === "forecast") setFc(await api.forecast(f.series.map((r) => r.soilMoisture), 30));
      if (kind === "summary") setSummary((await api.summarize(f.pending.map((a) => `${a.title}: ${a.message}`))).summary);
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <FadeIn>
        <ScreenHeader eyebrow="MONITOREO EN VIVO · NARIÑO" title="AgroTec" subtitle="Agricultura de precisión con IA" />
      </FadeIn>

      <FadeIn delay={60}>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={{ flex: 1 }}>
            <View style={styles.liveRow}>
              <Pulse color={riskColor(worst)} />
              <Text style={styles.kicker}>{f.auto ? "EN VIVO" : "PAUSADO"} · {fmtTime(shown.timestamp)}</Text>
            </View>
            <Text style={styles.heroTitle}>{worst === "ALTO" ? "Atención requerida" : worst === "MEDIO" ? "Revisar pronto" : "Cultivo estable"}</Text>
            <Text style={styles.heroText}>Cultivo en foco: <Text style={{ color: colors.lime, fontWeight: "800" }}>{f.crop}</Text></Text>
          </View>
          <View style={styles.orb}><Ionicons name={worst === "BAJO" ? "leaf" : "warning"} size={30} color={riskColor(worst)} /></View>
        </LinearGradient>
      </FadeIn>

      <FadeIn delay={110}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
          {CROPS.map((c) => <Chip key={c} label={c} selected={f.crop === c} onPress={() => f.setCrop(c)} />)}
        </ScrollView>
      </FadeIn>

      <Title
        sub={`Lista doble · lectura ${f.history.position} de ${f.history.size}`}
        right={
          <View style={{ flexDirection: "row", gap: 8 }}>
            <IconButton icon="chevron-back" label="Lectura anterior" onPress={f.historyPrev} disabled={!f.history.hasPrev} />
            <IconButton icon="chevron-forward" label="Lectura siguiente" onPress={f.historyNext} disabled={!f.history.hasNext} />
          </View>
        }
      >
        Sensores IoT
      </Title>
      {viewingPast ? (
        <BackToLatest onPress={f.historyLatest} />
      ) : null}

      <View style={styles.grid}>
        {SENSOR_ORDER.map((k, i) => (
          <FadeIn key={k} delay={140 + i * 60} style={{ width: "48.3%" }}>
            <SensorCard sensor={k} value={shown[k]} risk={risks[i]!} />
          </FadeIn>
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="Simular lectura" icon="flash" onPress={() => f.tick()} style={{ flex: 1 }} />
        <Button label={f.auto ? "Pausar" : "Reanudar"} icon={f.auto ? "pause" : "play"} variant="ghost" onPress={() => f.setAuto(!f.auto)} />
      </View>
      <View style={styles.actions}>
        <Button label="Simular sequía" icon="sunny" variant="ghost" onPress={() => { for (let i = 0; i < 4; i++) f.tick({ soilMoisture: -9, temperature: 0.8 }); }} style={{ flex: 1 }} />
        <Button label="Simular lluvia" icon="rainy" variant="ghost" onPress={() => { for (let i = 0; i < 3; i++) f.tick({ soilMoisture: 8, rain: 15 }); }} style={{ flex: 1 }} />
      </View>

      <Card style={{ marginTop: 6 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Tendencia de humedad</Text>
          <Tag text="REGRESIÓN LINEAL" />
        </View>
        <View style={{ marginVertical: 10 }}>
          <Sparkline data={f.series.map((r) => r.soilMoisture)} extra={fc?.forecast ?? []} />
        </View>
        {fc ? (
          <Text style={styles.body}>
            Tendencia <Text style={{ color: fc.trend === "BAJA" ? colors.danger : colors.lime, fontWeight: "800" }}>{fc.trend}</Text> ({fc.slope > 0 ? "+" : ""}{fc.slope.toFixed(2)} %/lectura, R² {fc.r2}).
            {fc.hoursToCritical !== null ? ` Llegaría al nivel crítico (30%) en ~${fc.hoursToCritical} lecturas.` : " No se prevé nivel crítico."}
          </Text>
        ) : (
          <Text style={styles.muted}>Calcula la predicción con los últimos {f.series.length} datos.</Text>
        )}
        <Button label="Predecir humedad" icon="trending-down" variant="ghost" loading={busy === "forecast"} onPress={() => run("forecast")} style={{ marginTop: 12 }} />
      </Card>

      <Card glow>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Análisis con IA</Text>
          {assessment ? <Tag text={assessment.source === "gemini" ? "GEMINI" : "REGLAS"} color={colors.violet} /> : <Tag text={backend === "gemini" ? "GEMINI ACTIVO" : backend === "reglas" ? "BACKEND OK" : "MODO LOCAL"} color={colors.violet} />}
        </View>
        {assessment ? (
          <View style={{ marginTop: 10, gap: 8 }}>
            <View style={styles.rowBetween}>
              <Pill risk={assessment.risk} label={`RIESGO ${assessment.risk}`} />
              <Tag text={`RIEGO: ${assessment.irrigation}`} color={assessment.irrigation === "URGENTE" ? colors.danger : colors.cyan} />
            </View>
            {assessment.messages.map((m) => <Text key={m} style={styles.body}>• {m}</Text>)}
            <Text style={[styles.body, { color: colors.text }]}>{assessment.advice}</Text>
          </View>
        ) : (
          <Text style={[styles.muted, { marginTop: 8 }]}>Evalúa riesgo, riego y recomendaciones para {f.crop} con las lecturas actuales.</Text>
        )}
        <Button label="Analizar mi cultivo" icon="sparkles" loading={busy === "analyze"} onPress={() => run("analyze")} style={{ marginTop: 12 }} />
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Cola de alertas</Text>
          <Tag text={`${f.pending.length} PENDIENTES`} color={f.pending.length ? colors.warning : colors.lime} />
        </View>
        <Text style={styles.muted}>Cola FIFO: se atiende primero la más antigua. La pila guarda las ya atendidas.</Text>
        {f.pending.length === 0 ? (
          <Text style={[styles.body, { marginTop: 10 }]}>Sin alertas por atender. 🎉</Text>
        ) : (
          <View style={{ marginTop: 10, gap: 8 }}>
            {f.pending.slice(0, 4).map((a, i) => (
              <View key={a.id} style={[styles.alert, i === 0 && { borderColor: riskColor(a.severity) + "88" }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{i === 0 ? "▶ " : ""}{a.title}</Text>
                  <Text style={styles.muted}>{a.message} · {fmtTime(a.timestamp)}</Text>
                </View>
              </View>
            ))}
            {f.pending.length > 4 ? <Text style={styles.muted}>… y {f.pending.length - 4} más</Text> : null}
          </View>
        )}
        <View style={[styles.actions, { marginTop: 12, marginBottom: 0 }]}>
          <Button label="Atender" icon="checkmark" variant="emerald" onPress={() => f.attendNext()} disabled={f.pending.length === 0} style={{ flex: 1 }} />
          <Button label="Resumen IA" icon="document-text" variant="ghost" loading={busy === "summary"} onPress={() => run("summary")} style={{ flex: 1 }} />
        </View>
        {summary ? <Text style={[styles.body, { marginTop: 12, color: colors.text }]}>{summary}</Text> : null}
        {f.attended.length > 0 ? (
          <Text style={[styles.muted, { marginTop: 10 }]}>Atendidas (pila): {f.attended.slice(0, 3).map((a) => a.title.split(" · ")[0]).join(" ← ")}</Text>
        ) : null}
      </Card>

      <Text style={styles.footer}>Datos simulados con fines académicos · {f.logSize} lecturas en el registro</Text>
      <Button label="Restablecer datos guardados" icon="trash-outline" variant="ghost" onPress={f.resetData} style={{ marginTop: 12 }} />
    </ScrollView>
  );
}

function BackToLatest({ onPress }: { onPress: () => void }) {
  return <Button label="Volver a la lectura actual" icon="return-up-forward" variant="ghost" onPress={onPress} style={{ marginBottom: 10 }} />;
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 120 },
  hero: { borderRadius: radius.lg, padding: 20, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#2A7A55", marginBottom: 14, minHeight: 130, overflow: "hidden" },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  kicker: { color: "#A6D5BB", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  heroTitle: { color: colors.text, fontSize: font.xl + 2, fontWeight: "900", marginTop: 6 },
  heroText: { color: "#B5CCBF", fontSize: font.sm, marginTop: 4 },
  orb: { width: 66, height: 66, borderRadius: 33, backgroundColor: "#0006", borderWidth: 1, borderColor: "#FFFFFF22", alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10, marginBottom: 14 },
  actions: { flexDirection: "row", gap: 10, marginBottom: 10 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardTitle: { color: colors.text, fontSize: font.md + 1, fontWeight: "800" },
  body: { color: colors.muted, fontSize: font.sm + 0.5, lineHeight: 19 },
  muted: { color: colors.muted, fontSize: font.sm, lineHeight: 18, marginTop: 4 },
  alert: { flexDirection: "row", borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.bg2, borderRadius: 14, padding: 11 },
  alertTitle: { color: colors.text, fontSize: font.sm + 0.5, fontWeight: "800" },
  footer: { color: colors.faint, fontSize: 11, textAlign: "center", marginTop: 8 },
});
