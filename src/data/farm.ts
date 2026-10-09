import { Graph, NaryNode, NaryTree } from "../structures";
import type { Lot } from "./types";

export const CROPS = ["Papa", "Café", "Hortalizas", "Maíz", "Fresa"] as const;
export const CROP_EMOJI: Record<string, string> = {
  Papa: "🥔",
  Café: "☕",
  Hortalizas: "🥬",
  Maíz: "🌽",
  Fresa: "🍓",
};

export const INITIAL_LOTS: Lot[] = [
  { id: "L1", code: 101, name: "Lote Norte", crop: "Papa", hectares: 2.4, moistureTarget: 48 },
  { id: "L2", code: 55, name: "Lote Sur", crop: "Café", hectares: 3.1, moistureTarget: 55 },
  { id: "L3", code: 160, name: "Invernadero", crop: "Hortalizas", hectares: 1.2, moistureTarget: 62 },
  { id: "L4", code: 32, name: "Ladera Alta", crop: "Maíz", hectares: 1.8, moistureTarget: 45 },
  { id: "L5", code: 210, name: "Vivero", crop: "Fresa", hectares: 0.6, moistureTarget: 58 },
];

/** Jerarquía finca → lote → cultivo → sensor (árbol N-ario). */
export function buildFarmTree(lots: Lot[]): NaryTree<string> {
  const root = new NaryNode("Finca AgroTec · Nariño");
  for (const lot of lots) {
    const lotNode = root.addChild(lot.name);
    const cropNode = lotNode.addChild(lot.crop);
    cropNode.addChild("Sensor humedad");
    cropNode.addChild("Sensor pH");
  }
  return new NaryTree(root);
}

export interface MapNode {
  name: string;
  x: number;
  y: number;
  /** Posición de la etiqueta respecto al punto. */
  label?: "above" | "below" | "left" | "right";
}

/** Posiciones ilustrativas (no a escala) sobre un lienzo 340×300. */
export const MAP_NODES: MapNode[] = [
  { name: "La Unión", label: "above", x: 150, y: 28 },
  { name: "Sandoná", label: "left", x: 95, y: 88 },
  { name: "Pasto", label: "right", x: 190, y: 128 },
  { name: "Samaniego", label: "below", x: 55, y: 165 },
  { name: "Túquerres", x: 120, y: 215 },
  { name: "Ipiales", x: 235, y: 262 },
  { name: "Tumaco", x: 38, y: 262 },
];

/** Distancias viales aproximadas (km), con fines académicos. */
export function buildRouteGraph(): Graph {
  const g = new Graph();
  MAP_NODES.forEach((n) => g.addVertex(n.name));
  g.addEdge("Pasto", "La Unión", 70);
  g.addEdge("Pasto", "Sandoná", 45);
  g.addEdge("Pasto", "Túquerres", 75);
  g.addEdge("Pasto", "Ipiales", 83);
  g.addEdge("Túquerres", "Ipiales", 55);
  g.addEdge("Sandoná", "Samaniego", 45);
  g.addEdge("Samaniego", "Túquerres", 60);
  g.addEdge("Túquerres", "Tumaco", 230);
  g.addEdge("La Unión", "Sandoná", 55);
  return g;
}

export const SYMPTOM_TERMS = [
  "hojas amarillas",
  "hojas enrolladas",
  "manchas foliares",
  "manchas negras en hojas",
  "mosca blanca",
  "pudrición de raíz",
  "marchitez",
  "roya del café",
  "tizón tardío",
  "tizón temprano",
  "ácaros",
  "pulgones",
  "deficiencia de nitrógeno",
  "estrés hídrico",
  "gusano blanco",
  "polilla guatemalteca",
  "broca del café",
];
