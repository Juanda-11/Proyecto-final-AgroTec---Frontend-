import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Rect, Text as SvgText } from "react-native-svg";
import { Button, Card, Chip, FadeIn, ScreenHeader, Tag, Title } from "../components/ui";
import { MAP_NODES, buildRouteGraph } from "../data/farm";
import type { PathResult } from "../structures";
import { colors, font } from "../theme";

type Mode = "dijkstra" | "bfs" | "dfs";

/** Etiqueta con halo oscuro para que se lea sobre las aristas. */
function NodeLabel({ node }: { node: (typeof MAP_NODES)[number] }) {
  const side = node.label ?? "below";
  const x = side === "left" ? node.x - 17 : side === "right" ? node.x + 17 : node.x;
  const y = side === "above" ? node.y - 18 : side === "below" ? node.y + 27 : node.y + 4;
  const anchor = side === "left" ? "end" : side === "right" ? "start" : "middle";
  return (
    <>
      <SvgText x={x} y={y} stroke="#0C1B14" strokeWidth={4} strokeLinejoin="round" fill="#0C1B14" fontSize="11.5" fontWeight="800" textAnchor={anchor}>{node.name}</SvgText>
      <SvgText x={x} y={y} fill={colors.text} fontSize="11.5" fontWeight="800" textAnchor={anchor}>{node.name}</SvgText>
    </>
  );
}

export function RoutesScreen() {
  const graph = useMemo(buildRouteGraph, []);
  const names = MAP_NODES.map((n) => n.name);
  const [origin, setOrigin] = useState("Tumaco");
  const [dest, setDest] = useState("Ipiales");
  const [mode, setMode] = useState<Mode>("dijkstra");
  const [result, setResult] = useState<PathResult | null>(() => graph.shortestPath("Tumaco", "Ipiales"));
  const [order, setOrder] = useState<string[]>([]);

  const compute = (m: Mode = mode, o = origin, d = dest) => {
    if (m === "dijkstra") {
      setResult(graph.shortestPath(o, d));
      setOrder([]);
    } else {
      const visit = m === "bfs" ? graph.bfs(o) : graph.dfs(o);
      setOrder(visit);
      setResult(null);
    }
  };

  const onPath = (a: string, b: string) => {
    const p = result?.path ?? [];
    for (let i = 0; i < p.length - 1; i++) if ((p[i] === a && p[i + 1] === b) || (p[i] === b && p[i + 1] === a)) return true;
    return false;
  };
  const pos = (n: string) => MAP_NODES.find((x) => x.name === n)!;

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <FadeIn><ScreenHeader eyebrow="LOGÍSTICA · GRAFOS" title="Rutas" subtitle="De la finca al mercado en Nariño" /></FadeIn>

      <FadeIn delay={60}>
        <Card glow style={{ padding: 10 }}>
          <Svg width="100%" height={300} viewBox="0 0 340 300">
            {graph.edges().map((e) => {
              const a = pos(e.a), b = pos(e.b), hot = onPath(e.a, e.b);
              const t = e.weight > 100 ? 0.4 : 0.5;
              const mx = a.x + (b.x - a.x) * t, my = a.y + (b.y - a.y) * t;
              return (
                <React.Fragment key={e.a + e.b}>
                  <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={hot ? colors.lime : "#2E5B43"} strokeWidth={hot ? 4 : 2} strokeLinecap="round" />
                  <Rect x={mx - 20} y={my - 17} width={40} height={14} rx={7} fill="#0C1B14" opacity={0.92} />
                  <SvgText x={mx} y={my - 7} fill={hot ? colors.lime : "#7D9A8B"} fontSize="10" fontWeight="700" textAnchor="middle">{e.weight} km</SvgText>
                </React.Fragment>
              );
            })}
            {MAP_NODES.map((n) => {
              const inPath = result?.path.includes(n.name);
              const idx = order.indexOf(n.name);
              return (
                <React.Fragment key={n.name}>
                  <Circle cx={n.x} cy={n.y} r={inPath || idx >= 0 ? 13 : 10} fill={inPath ? colors.lime : idx >= 0 ? colors.cyan : "#1D5A3C"} stroke={colors.emerald} strokeWidth={2} />
                  {idx >= 0 ? <SvgText x={n.x} y={n.y + 4} fill="#06231A" fontSize="12" fontWeight="900" textAnchor="middle">{idx + 1}</SvgText> : null}
                  <NodeLabel node={n} />
                </React.Fragment>
              );
            })}
          </Svg>
          <Text style={styles.caption}>Mapa ilustrativo (no a escala) · distancias viales aproximadas</Text>
        </Card>
      </FadeIn>

      <Title sub="Elige el algoritmo del grafo">Algoritmo</Title>
      <View style={styles.wrap}>
        <Chip label="Ruta más corta" selected={mode === "dijkstra"} onPress={() => { setMode("dijkstra"); compute("dijkstra"); }} />
        <Chip label="Recorrido BFS" selected={mode === "bfs"} onPress={() => { setMode("bfs"); compute("bfs"); }} />
        <Chip label="Recorrido DFS" selected={mode === "dfs"} onPress={() => { setMode("dfs"); compute("dfs"); }} />
      </View>

      <Title sub={mode === "dijkstra" ? "Origen y destino" : "Punto de partida del recorrido"}>Trayecto</Title>
      <Text style={styles.label}>ORIGEN</Text>
      <View style={styles.wrap}>{names.map((n) => <Chip key={n} label={n} selected={origin === n} onPress={() => { setOrigin(n); compute(mode, n, dest); }} />)}</View>
      {mode === "dijkstra" ? (
        <>
          <Text style={[styles.label, { marginTop: 14 }]}>DESTINO</Text>
          <View style={styles.wrap}>{names.map((n) => <Chip key={n} label={n} selected={dest === n} onPress={() => { setDest(n); compute(mode, origin, n); }} />)}</View>
        </>
      ) : null}

      <Button label="Calcular" icon="navigate" onPress={() => compute()} style={{ marginTop: 18 }} />

      <Card style={{ marginTop: 14 }}>
        <Tag text={mode === "dijkstra" ? "DIJKSTRA" : mode === "bfs" ? "ANCHURA (COLA)" : "PROFUNDIDAD (PILA)"} />
        {mode === "dijkstra" ? (
          result && result.path.length ? (
            <>
              <Text style={styles.path}>{result.path.join("  →  ")}</Text>
              <Text style={styles.dist}>{result.distance} km</Text>
              <Text style={styles.muted}>{result.path.length - 1} tramos · ruta de menor distancia</Text>
            </>
          ) : (
            <Text style={styles.muted}>No hay conexión entre esos puntos.</Text>
          )
        ) : order.length ? (
          <>
            <Text style={styles.path}>{order.join("  →  ")}</Text>
            <Text style={styles.muted}>Orden de visita desde {origin} ({order.length} de {names.length} puntos alcanzables).</Text>
          </>
        ) : (
          <Text style={styles.muted}>Pulsa “Calcular” para ver el orden del recorrido.</Text>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 120 },
  caption: { color: colors.faint, fontSize: 11, textAlign: "center", marginTop: 4 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  label: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, marginBottom: 8 },
  path: { color: colors.text, fontSize: font.lg, fontWeight: "800", lineHeight: 26, marginTop: 10 },
  dist: { color: colors.lime, fontSize: 34, fontWeight: "900", marginTop: 6 },
  muted: { color: colors.muted, fontSize: font.sm, lineHeight: 18, marginTop: 6 },
});
