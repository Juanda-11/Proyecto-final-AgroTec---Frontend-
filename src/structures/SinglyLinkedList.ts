class SNode<T> {
  constructor(public value: T, public next: SNode<T> | null = null) {}
}

/** Lista simple. Uso: historial secuencial de lecturas (la más reciente al inicio). */
export class SinglyLinkedList<T> {
  private head: SNode<T> | null = null;
  private count = 0;

  prepend(value: T): void {
    this.head = new SNode(value, this.head);
    this.count++;
  }
  append(value: T): void {
    const node = new SNode(value);
    if (!this.head) this.head = node;
    else {
      let cur = this.head;
      while (cur.next) cur = cur.next;
      cur.next = node;
    }
    this.count++;
  }
  find(predicate: (v: T) => boolean): T | undefined {
    for (let cur = this.head; cur; cur = cur.next) if (predicate(cur.value)) return cur.value;
    return undefined;
  }
  remove(predicate: (v: T) => boolean): boolean {
    let prev: SNode<T> | null = null;
    for (let cur = this.head; cur; prev = cur, cur = cur.next) {
      if (predicate(cur.value)) {
        if (prev) prev.next = cur.next;
        else this.head = cur.next;
        this.count--;
        return true;
      }
    }
    return false;
  }
  /** Conserva solo los primeros `max` nodos (descarta lo más antiguo si se usa con prepend). */
  truncate(max: number): void {
    if (this.count <= max) return;
    if (max <= 0) {
      this.head = null;
      this.count = 0;
      return;
    }
    let cur = this.head!;
    for (let i = 1; i < max; i++) cur = cur.next!;
    cur.next = null;
    this.count = max;
  }
  get size(): number {
    return this.count;
  }
  toArray(): T[] {
    const out: T[] = [];
    for (let cur = this.head; cur; cur = cur.next) out.push(cur.value);
    return out;
  }
}
