import React, { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Button, Card, Chip, FadeIn, Pill, Pulse, ScreenHeader, Tag, Title } from "../components/ui";
import { CROPS, SYMPTOM_TERMS } from "../data/farm";
import type { ChatMessage, DiagnoseResult } from "../data/types";
import * as api from "../services/api";
import { useFarm } from "../store/FarmContext";
import { Trie } from "../structures";
import { colors, font, gradients, radius } from "../theme";

const QUICK = ["¿Debo regar hoy?", "¿Cómo prevengo el tizón?", "Mi pH está bajo, ¿qué hago?", "¿Qué abono uso en papa?"];

export function AssistantScreen({ backend }: { backend: "gemini" | "reglas" | "offline" }) {
  const f = useFarm();
  const trie = useMemo(() => { const t = new Trie(); SYMPTOM_TERMS.forEach((s) => t.insert(s)); return t; }, []);
  const scroller = useRef<ScrollView>(null);
  const [tab, setTab] = useState<"chat" | "diag">("chat");

  const [msgs, setMsgs] = useState<ChatMessage[]>([
    { id: "w", role: "assistant", text: "¡Hola! Soy AgroIA 🌱. Conozco las lecturas de tu finca y puedo ayudarte con riego, plagas, pH y fertilización." },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const send = async (text = input) => {
    const clean = text.trim();
    if (!clean || thinking) return;
    const user: ChatMessage = { id: `u${Date.now()}`, role: "user", text: clean };
    setMsgs((m) => [...m, user]);
    setInput("");
    setThinking(true);
    const r = await api.chat(clean, msgs, f.reading, f.crop);
    setMsgs((m) => [...m, { id: `a${Date.now()}`, role: "assistant", text: r.reply, source: r.source }]);
    setThinking(false);
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 80);
  };

  // Diagnóstico
  const [crop, setCrop] = useState<string>(f.crop);
  const [symptoms, setSymptoms] = useState("");
  const [image, setImage] = useState<{ uri: string; base64: string; mime: string } | null>(null);
  const [diag, setDiag] = useState<DiagnoseResult | null>(null);
  const [diagBusy, setDiagBusy] = useState(false);

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], base64: true, quality: 0.4 });
    const a = r.assets?.[0];
    if (!r.canceled && a?.base64) setImage({ uri: a.uri, base64: a.base64, mime: a.mimeType ?? "image/jpeg" });
  };

  const runDiag = async () => {
    if (symptoms.trim().length < 3) return;
    setDiagBusy(true);
    setDiag(await api.diagnose(crop, symptoms.trim(), image ? { base64: image.base64, mime: image.mime } : undefined));
    setDiagBusy(false);
  };

  const sugg = tab === "diag" ? trie.startsWith(symptoms.split(",").pop() ?? "") : trie.startsWith(input);
  const urgColor = diag ? (diag.urgency === "ALTO" ? colors.danger : diag.urgency === "MEDIO" ? colors.warning : colors.lime) : colors.lime;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView ref={scroller} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <FadeIn><ScreenHeader eyebrow="AGROIA · ASISTENTE" title="Inteligencia" subtitle="Chat, diagnóstico y predicción" /></FadeIn>

        <LinearGradient colors={gradients.ai} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.avatar}><Ionicons name="sparkles" size={24} color={colors.lime} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>AgroIA</Text>
            <Text style={styles.muted}>{backend === "gemini" ? "Conectada a Gemini" : backend === "reglas" ? "Backend activo · modo reglas" : "Modo local sin conexión"}</Text>
          </View>
          <Pulse color={backend === "offline" ? colors.warning : colors.lime} />
        </LinearGradient>

        <View style={styles.tabs}>
          <Chip label="💬 Chat" selected={tab === "chat"} onPress={() => setTab("chat")} />
          <Chip label="🩺 Diagnóstico" selected={tab === "diag"} onPress={() => setTab("diag")} />
        </View>

        {tab === "chat" ? (
          <>
            {msgs.map((m) => (
              <FadeIn key={m.id}>
                <View style={[styles.bubble, m.role === "user" ? styles.user : styles.ai]}>
                  <Text style={styles.role}>{m.role === "user" ? "TÚ" : `AGROIA${m.source ? " · " + (m.source === "gemini" ? "GEMINI" : "REGLAS") : ""}`}</Text>
                  <Text style={styles.msg}>{m.text}</Text>
                </View>
              </FadeIn>
            ))}
            {thinking ? <View style={[styles.bubble, styles.ai, { flexDirection: "row", gap: 8, alignItems: "center" }]}><ActivityIndicator color={colors.lime} /><Text style={styles.muted}>AgroIA está pensando…</Text></View> : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 10 }} keyboardShouldPersistTaps="handled">
              {QUICK.map((q) => <Chip key={q} label={q} onPress={() => send(q)} />)}
            </ScrollView>

            {input.trim().length >= 2 && sugg.length > 0 ? (
              <Card style={{ padding: 10, marginBottom: 8 }}>
                <Tag text="TRIE · AUTOCOMPLETADO" color={colors.violet} />
                {sugg.map((s) => (
                  <Pressable key={s} onPress={() => setInput(s)} style={styles.sugg}><Text style={styles.suggText}>{s}</Text></Pressable>
                ))}
              </Card>
            ) : null}

            <View style={styles.inputWrap}>
              <TextInput value={input} onChangeText={setInput} placeholder="Pregúntale a AgroIA…" placeholderTextColor={colors.faint} style={styles.input} onSubmitEditing={() => send()} returnKeyType="send" maxLength={500} />
              <Pressable onPress={() => send()} style={styles.send} accessibilityLabel="Enviar" accessibilityRole="button"><Ionicons name="arrow-up" size={22} color="#10210F" /></Pressable>
            </View>
          </>
        ) : (
          <>
            <Title sub="Describe lo que ves o sube una foto de la hoja">Diagnóstico de cultivo</Title>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
              {CROPS.map((c) => <Chip key={c} label={c} selected={crop === c} onPress={() => setCrop(c)} />)}
            </ScrollView>
            <TextInput value={symptoms} onChangeText={setSymptoms} multiline placeholder="Ej. hojas amarillas con manchas negras…" placeholderTextColor={colors.faint} style={[styles.input, styles.area]} maxLength={600} />
            {symptoms.trim().length >= 2 && sugg.length > 0 ? (
              <View style={styles.suggRow}>
                {sugg.map((s) => <Chip key={s} label={s} onPress={() => setSymptoms((p) => (p.includes(",") ? p.slice(0, p.lastIndexOf(",") + 1) + " " : "") + s)} />)}
              </View>
            ) : null}
            {image ? (
              <View style={styles.imgWrap}>
                <Image source={{ uri: image.uri }} style={styles.img} />
                <Pressable onPress={() => setImage(null)} style={styles.imgX} accessibilityLabel="Quitar foto"><Ionicons name="close" size={16} color={colors.text} /></Pressable>
              </View>
            ) : null}
            <View style={styles.row}>
              <Button label={image ? "Cambiar foto" : "Subir foto"} icon="camera" variant="ghost" onPress={pickImage} style={{ flex: 1 }} />
              <Button label="Diagnosticar" icon="medkit" loading={diagBusy} onPress={runDiag} disabled={symptoms.trim().length < 3} style={{ flex: 1 }} />
            </View>

            {diag ? (
              <FadeIn style={{ marginTop: 14 }}>
                <Card glow>
                  <View style={styles.rowBetween}>
                    <Pill risk={diag.urgency} label={`URGENCIA ${diag.urgency}`} />
                    <Tag text={diag.source === "gemini" ? "GEMINI" : "REGLAS"} color={colors.violet} />
                  </View>
                  <Text style={[styles.cardTitle, { marginTop: 12 }]}>Causas probables</Text>
                  {diag.probableCauses.map((c) => <Text key={c} style={[styles.msg, { color: urgColor }]}>• {c}</Text>)}
                  <Text style={[styles.cardTitle, { marginTop: 12 }]}>Recomendación</Text>
                  <Text style={styles.msg}>{diag.recommendation}</Text>
                  <Text style={[styles.muted, { marginTop: 10 }]}>{diag.disclaimer}</Text>
                </Card>
              </FadeIn>
            ) : null}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 120 },
  hero: { borderRadius: radius.lg, padding: 15, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "#3B3470", marginBottom: 14 },
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#B8F34A1A", alignItems: "center", justifyContent: "center" },
  heroTitle: { color: colors.text, fontSize: font.lg, fontWeight: "900" },
  muted: { color: colors.muted, fontSize: font.sm, lineHeight: 18 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 14 },
  bubble: { maxWidth: "90%", padding: 13, borderRadius: 18, marginBottom: 10 },
  ai: { alignSelf: "flex-start", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 5 },
  user: { alignSelf: "flex-end", backgroundColor: colors.emeraldDark, borderBottomRightRadius: 5 },
  role: { color: colors.lime, fontSize: 10, fontWeight: "900", marginBottom: 5, letterSpacing: 0.6 },
  msg: { color: colors.text, fontSize: font.md, lineHeight: 21, marginTop: 2 },
  inputWrap: { flexDirection: "row", backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 5, gap: 6 },
  input: { flex: 1, color: colors.text, fontSize: font.md, paddingHorizontal: 12, minHeight: 46 },
  send: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.lime, alignItems: "center", justifyContent: "center" },
  sugg: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#173025" },
  suggText: { color: colors.text, fontSize: font.sm + 0.5 },
  suggRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 10 },
  area: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 18, minHeight: 100, textAlignVertical: "top", paddingTop: 12, flex: 0 },
  row: { flexDirection: "row", gap: 10, marginTop: 10 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  imgWrap: { marginTop: 10, alignSelf: "flex-start" },
  img: { width: 120, height: 120, borderRadius: 16 },
  imgX: { position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: "#000A", alignItems: "center", justifyContent: "center" },
  cardTitle: { color: colors.text, fontSize: font.md + 1, fontWeight: "800" },
});
