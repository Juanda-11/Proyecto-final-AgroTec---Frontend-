class AVLNode<V> {
  height = 1;
  left: AVLNode<V> | null = null;
  right: AVLNode<V> | null = null;
  constructor(public key: number, public value: V) {}
}

const h = <V>(n: AVLNode<V> | null) => n?.height ?? 0;
const upd = <V>(n: AVLNode<V>) => {
  n.height = 1 + Math.max(h(n.left), h(n.right));
};
const balance = <V>(n: AVLNode<V> | null) => (n ? h(n.left) - h(n.right) : 0);

function rotateRight<V>(y: AVLNode<V>): AVLNode<V> {
  const x = y.left!;
  y.left = x.right;
  x.right = y;
  upd(y);
  upd(x);
  return x;
}
function rotateLeft<V>(x: AVLNode<V>): AVLNode<V> {
  const y = x.right!;
  x.right = y.left;
  y.left = x;
  upd(x);
  upd(y);
  return y;
}
function rebalance<V>(n: AVLNode<V>): AVLNode<V> {
  upd(n);
  const b = balance(n);
  if (b > 1) {
    if (balance(n.left) < 0) n.left = rotateLeft(n.left!); // LR
    return rotateRight(n); // LL
  }
  if (b < -1) {
    if (balance(n.right) > 0) n.right = rotateRight(n.right!); // RL
    return rotateLeft(n); // RR
  }
  return n;
}

/** Árbol AVL auto-balanceado. Uso: índice de parcelas por código, búsqueda O(log n). */
export class AVLTree<V> {
  private root: AVLNode<V> | null = null;
  private count = 0;
  /** Número de rotaciones realizadas (útil para mostrar el balanceo en la UI). */
  rotations = 0;

  insert(key: number, value: V): void {
    const ins = (n: AVLNode<V> | null): AVLNode<V> => {
      if (!n) {
        this.count++;
        return new AVLNode(key, value);
      }
      if (key < n.key) n.left = ins(n.left);
      else if (key > n.key) n.right = ins(n.right);
      else {
        n.value = value;
        return n;
      }
      const r = rebalance(n);
      if (r !== n) this.rotations++;
      return r;
    };
    this.root = ins(this.root);
  }

  find(key: number): V | undefined {
    let cur = this.root;
    while (cur) {
      if (key === cur.key) return cur.value;
      cur = key < cur.key ? cur.left : cur.right;
    }
    return undefined;
  }

  remove(key: number): boolean {
    let removed = false;
    const del = (n: AVLNode<V> | null, k: number): AVLNode<V> | null => {
      if (!n) return null;
      if (k < n.key) n.left = del(n.left, k);
      else if (k > n.key) n.right = del(n.right, k);
      else {
        removed = true;
        if (!n.left || !n.right) return n.left ?? n.right;
        let s = n.right;
        while (s.left) s = s.left;
        n.key = s.key;
        n.value = s.value;
        n.right = del(n.right, s.key);
      }
      return rebalance(n);
    };
    this.root = del(this.root, key);
    if (removed) this.count--;
    return removed;
  }

  get height(): number {
    return h(this.root);
  }
  get size(): number {
    return this.count;
  }
  /** Recorrido inorden: claves ordenadas. */
  inorder(): Array<{ key: number; value: V }> {
    const out: Array<{ key: number; value: V }> = [];
    const walk = (n: AVLNode<V> | null) => {
      if (!n) return;
      walk(n.left);
      out.push({ key: n.key, value: n.value });
      walk(n.right);
    };
    walk(this.root);
    return out;
  }
  /** Recorrido por niveles (para dibujar el árbol). */
  levels(): Array<Array<number | null>> {
    const out: Array<Array<number | null>> = [];
    let level: Array<AVLNode<V> | null> = this.root ? [this.root] : [];
    while (level.some(Boolean)) {
      out.push(level.map((n) => (n ? n.key : null)));
      level = level.flatMap((n) => [n?.left ?? null, n?.right ?? null]);
    }
    return out;
  }
  /** Comprueba el invariante AVL (|balance| <= 1 en todos los nodos). */
  isBalanced(): boolean {
    const ok = (n: AVLNode<V> | null): boolean => !n || (Math.abs(balance(n)) <= 1 && ok(n.left) && ok(n.right));
    return ok(this.root);
  }
}
