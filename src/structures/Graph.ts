export interface Edge {
  to: string;
  weight: number;
}
export interface PathResult {
  path: string[];
  distance: number;
}

/** Grafo no dirigido ponderado (lista de adyacencia). Uso: red de rutas y conectividad. */
export class Graph {
  private adj = new Map<string, Edge[]>();

  addVertex(v: string): void {
    if (!this.adj.has(v)) this.adj.set(v, []);
  }
  addEdge(a: string, b: string, weight = 1): void {
    this.addVertex(a);
    this.addVertex(b);
    this.adj.get(a)!.push({ to: b, weight });
    this.adj.get(b)!.push({ to: a, weight });
  }
  vertices(): string[] {
    return [...this.adj.keys()];
  }
  edges(): Array<{ a: string; b: string; weight: number }> {
    const seen = new Set<string>();
    const out: Array<{ a: string; b: string; weight: number }> = [];
    for (const [a, list] of this.adj)
      for (const { to: b, weight } of list) {
        const k = [a, b].sort().join("|");
        if (!seen.has(k)) {
          seen.add(k);
          out.push({ a, b, weight });
        }
      }
    return out;
  }
  neighbors(v: string): Edge[] {
    return this.adj.get(v) ?? [];
  }

  /** Recorrido en anchura: orden de visita y camino con menos saltos. */
  bfs(start: string): string[] {
    if (!this.adj.has(start)) return [];
    const seen = new Set([start]);
    const order: string[] = [];
    const q: string[] = [start];
    for (let i = 0; i < q.length; i++) {
      const v = q[i]!;
      order.push(v);
      for (const { to } of this.neighbors(v))
        if (!seen.has(to)) {
          seen.add(to);
          q.push(to);
        }
    }
    return order;
  }
  /** Recorrido en profundidad (iterativo). */
  dfs(start: string): string[] {
    if (!this.adj.has(start)) return [];
    const seen = new Set<string>();
    const order: string[] = [];
    const stack = [start];
    while (stack.length) {
      const v = stack.pop()!;
      if (seen.has(v)) continue;
      seen.add(v);
      order.push(v);
      for (const { to } of [...this.neighbors(v)].reverse()) if (!seen.has(to)) stack.push(to);
    }
    return order;
  }
  /** Dijkstra: ruta de menor distancia. path = [] si no hay conexión. */
  shortestPath(start: string, end: string): PathResult {
    if (!this.adj.has(start) || !this.adj.has(end)) return { path: [], distance: Infinity };
    const dist = new Map<string, number>(this.vertices().map((v) => [v, Infinity]));
    const prev = new Map<string, string>();
    const todo = new Set(this.vertices());
    dist.set(start, 0);
    while (todo.size) {
      let u: string | null = null;
      let best = Infinity;
      for (const v of todo) {
        const d = dist.get(v)!;
        if (d < best) {
          best = d;
          u = v;
        }
      }
      if (u === null) break; // el resto es inalcanzable
      todo.delete(u);
      if (u === end) break;
      for (const { to, weight } of this.neighbors(u)) {
        const alt = best + weight;
        if (alt < dist.get(to)!) {
          dist.set(to, alt);
          prev.set(to, u);
        }
      }
    }
    const d = dist.get(end)!;
    if (d === Infinity) return { path: [], distance: Infinity };
    const path = [end];
    while (path[0] !== start) path.unshift(prev.get(path[0]!)!);
    return { path, distance: d };
  }
  isConnected(a: string, b: string): boolean {
    return this.bfs(a).includes(b);
  }
}
