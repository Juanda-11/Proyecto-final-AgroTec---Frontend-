import React, { useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, FadeIn, IconButton, ScreenHeader, Tag, Title } from "../components/ui";
import { CROP_EMOJI, buildFarmTree } from "../data/farm";
import { AVLTree, CircularLinkedList, DoublyCircularList } from "../structures";
import { useFarm } from "../store/FarmContext";
import { ProgressBar } from "../components/ui";
import { colors, font, radius } from "../theme";
import type { Lot } from "../data/types";

export function FarmScreen() {
  const f = useFarm();
  const tree = useMemo(() => buildFarmTree(f.lots), [f.lots]);

  // Índice AVL de parcelas por código
  const avl = useRef<AVLTree<Lot>>(null as unknown as AVLTree<Lot>);
  if (!avl.current) {
    avl.current = new AVLTree<Lot>();
    f.lots.forEach((l) => avl.current.insert(l.code, l));
  }
  const [query, setQuery] = useState("");
  const [newCode, setNewCode] = useState("");
  const [, force] = useState(0);
  const found = query.trim() === "" ? undefined : avl.current.find(Number(query));

  const addParcel = () => {
    const code = Number(newCode);
    if (!Number.isInteger(code) || code <= 0) return;
    avl.current.insert(code, { id: `X${code}`, code, name: `Parcela ${code}`, crop: "Papa", hectares: 1, moistureTarget: 45 });
    setNewCode("");
    force((x) => x + 1);
  };

  // Rondas: circular simple (rotación) y circular doble (inspección)
  const rotation = useRef(new CircularLinkedList<string>());
  const round = useRef(new DoublyCircularList<string>());
  if (rotation.current.size === 0) f.lots.forEach((l) => { rotation.current.add(l.crop); round.current.add(l.name); });
  const [rot, setRot] = useState(rotation.current.current());
  const [stop, setStop] = useState(round.current.current());

  const levels = avl.current.levels();

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <FadeIn><ScreenHeader eyebrow="GESTIÓN AGRÍCOLA" title="Cultivos y lotes" subtitle="Árboles, listas circulares y pila de cambios" /></FadeIn>

      <Title sub={`${f.lots.length} lotes · pila para deshacer`}
        right={<IconButton icon="arrow-undo" label="Deshacer último cambio" onPress={() => f.undoConfig()} disabled={!f.canUndo} />}>
        Lotes registrados
      </Title>
      {f.lots.map((lot, i) => (
        <FadeIn key={lot.id} delay={i * 50}>
          <Card style={{ padding: 14, marginBottom: 10 }}>
            <View style={styles.row}>
              <View style={styles.avatar}><Text style={{ fontSize: 24 }}>{CROP_EMOJI[lot.crop] ?? "🌱"}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{lot.name}</Text>
                <Text style={styles.muted}>{lot.crop} · {lot.hectares.toFixed(1)} ha · cód. {lot.code}</Text>
              </View>
              <View style={styles.stepper}>
                <IconButton icon="remove" label={`Bajar objetivo de ${lot.name}`} onPress={() => f.setMoistureTarget(lot.id, lot.moistureTarget - 5)} />
                <Text style={styles.stepVal}>{lot.moistureTarget}%</Text>
                <IconButton icon="add" label={`Subir objetivo de ${lot.name}`} onPress={() => f.setMoistureTarget(lot.id, lot.moistureTarget + 5)} />
              </View>
            </View>
            <View style={{ marginTop: 10 }}><ProgressBar value={lot.moistureTarget / 100} /></View>
            <Text style={[styles.muted, { marginTop: 4 }]}>Objetivo de humedad</Text>
          </Card>
        </FadeIn>
      ))}

      <Title sub="Árbol N-ario · finca → lote → cultivo → sensor">Jerarquía de la finca</Title>
      <Card>
        {tree.flatten().map((n, i) => (
          <View key={i} style={[styles.treeRow, { paddingLeft: n.depth * 18 }]}>
            <Ionicons name={n.depth === 0 ? "home" : n.depth === 1 ? "map" : n.depth === 2 ? "leaf" : "hardware-chip"} size={14} color={[colors.lime, colors.cyan, colors.emerald, colors.violet][n.depth] ?? colors.muted} />
            <Text style={[styles.treeText, n.depth === 0 && { fontWeight: "800", color: colors.text }]}>{n.value}</Text>
          </View>
        ))}
        <Text style={[styles.muted, { marginTop: 8 }]}>{tree.count()} nodos · profundidad {tree.depth()}</Text>
      </Card>

      <Title sub={`Árbol AVL · ${avl.current.size} parcelas · altura ${avl.current.height} · ${avl.current.rotations} rotaciones`}>Índice de parcelas</Title>
      <Card glow>
        <View style={styles.row}>
          <TextInput style={styles.input} value={query} onChangeText={setQuery} keyboardType="number-pad" placeholder="Buscar código (p. ej. 101)" placeholderTextColor={colors.faint} />
        </View>
        {query.trim() !== "" && (
          <Text style={[styles.result, { color: found ? colors.lime : colors.danger }]}>
            {found ? `✔ ${found.name} · ${found.crop}` : "✖ No existe esa parcela"}
          </Text>
        )}
        <View style={styles.avlBox}>
          {levels.map((lvl, i) => (
            <View key={i} style={styles.avlLevel}>
              {lvl.map((k, j) => (
                <View key={j} style={[styles.avlNode, k === null && { opacity: 0 }, found && k === found.code && { backgroundColor: colors.lime }]}>
                  <Text style={[styles.avlText, found && k === found.code && { color: "#10210F" }]}>{k ?? ""}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
        <View style={[styles.row, { marginTop: 10 }]}>
          <TextInput style={[styles.input, { flex: 1 }]} value={newCode} onChangeText={setNewCode} keyboardType="number-pad" placeholder="Nuevo código" placeholderTextColor={colors.faint} />
          <Button label="Insertar" icon="add-circle" variant="emerald" onPress={addParcel} />
        </View>
        <Text style={styles.muted}>Inserta varios códigos seguidos (1, 2, 3, 4…): el árbol se rota solo y mantiene su altura baja.</Text>
      </Card>

      <Title sub="Lista circular · rotación de cultivos">Rotación</Title>
      <Card>
        <Text style={styles.big}>{CROP_EMOJI[rot ?? ""] ?? "🌱"} {rot}</Text>
        <Text style={styles.muted}>Tras el último cultivo, la lista vuelve al primero.</Text>
        <Button label="Siguiente cultivo" icon="refresh" variant="ghost" onPress={() => setRot(rotation.current.next())} style={{ marginTop: 12 }} />
      </Card>

      <Title sub="Lista circular doble · ronda de inspección">Ronda del técnico</Title>
      <Card>
        <Text style={styles.big}>📍 {stop}</Text>
        <Tag text="AVANZA O RETROCEDE SIN FIN" />
        <View style={[styles.row, { marginTop: 12 }]}>
          <Button label="Anterior" icon="arrow-back" variant="ghost" onPress={() => setStop(round.current.prev())} style={{ flex: 1 }} />
          <Button label="Siguiente" icon="arrow-forward" variant="ghost" onPress={() => setStop(round.current.next())} style={{ flex: 1 }} />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 120 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: "#173325", alignItems: "center", justifyContent: "center" },
  cardTitle: { color: colors.text, fontSize: font.md + 1, fontWeight: "800" },
  muted: { color: colors.muted, fontSize: font.sm, lineHeight: 18, marginTop: 3 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepVal: { color: colors.lime, fontWeight: "900", fontSize: font.md, minWidth: 40, textAlign: "center" },
  treeRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 },
  treeText: { color: colors.muted, fontSize: font.sm + 0.5 },
  input: { flex: 1, color: colors.text, backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, minHeight: 48, fontSize: font.md },
  result: { fontWeight: "800", fontSize: font.md, marginTop: 10 },
  avlBox: { marginTop: 14, gap: 8, alignItems: "center" },
  avlLevel: { flexDirection: "row", gap: 6, justifyContent: "center" },
  avlNode: { minWidth: 40, height: 34, paddingHorizontal: 6, borderRadius: 17, backgroundColor: "#1D5A3C", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#4C9D6F" },
  avlText: { color: colors.text, fontWeight: "800", fontSize: font.sm },
  big: { color: colors.lime, fontSize: font.xl, fontWeight: "900", marginBottom: 6, borderRadius: radius.md },
});
