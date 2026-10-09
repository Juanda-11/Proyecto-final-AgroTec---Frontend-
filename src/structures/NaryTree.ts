export class NaryNode<T> {
  children: NaryNode<T>[] = [];
  constructor(public value: T) {}
  addChild(value: T): NaryNode<T> {
    const child = new NaryNode(value);
    this.children.push(child);
    return child;
  }
}

/** Árbol N-ario. Uso: jerarquía finca → lote → cultivo → sensor. */
export class NaryTree<T> {
  constructor(public root: NaryNode<T>) {}

  /** Recorrido en preorden con profundidad. */
  flatten(): Array<{ value: T; depth: number }> {
    const out: Array<{ value: T; depth: number }> = [];
    const walk = (n: NaryNode<T>, depth: number) => {
      out.push({ value: n.value, depth });
      n.children.forEach((c) => walk(c, depth + 1));
    };
    walk(this.root, 0);
    return out;
  }
  count(): number {
    return this.flatten().length;
  }
  depth(): number {
    const d = (n: NaryNode<T>): number => 1 + Math.max(0, ...n.children.map(d));
    return d(this.root);
  }
  /** Camino desde la raíz hasta el primer nodo que cumpla el predicado. */
  pathTo(predicate: (v: T) => boolean): T[] | null {
    const walk = (n: NaryNode<T>, path: T[]): T[] | null => {
      const next = [...path, n.value];
      if (predicate(n.value)) return next;
      for (const c of n.children) {
        const r = walk(c, next);
        if (r) return r;
      }
      return null;
    };
    return walk(this.root, []);
  }
}
