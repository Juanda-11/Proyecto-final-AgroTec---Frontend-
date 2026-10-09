class DNode<T> {
  constructor(public value: T, public next: DNode<T> | null = null, public prev: DNode<T> | null = null) {}
}

/** Lista doble con cursor. Uso: navegar el historial anterior/siguiente. */
export class DoublyLinkedList<T> {
  private head: DNode<T> | null = null;
  private tail: DNode<T> | null = null;
  private cursor: DNode<T> | null = null;
  private count = 0;

  append(value: T): void {
    const node = new DNode(value);
    if (!this.tail) {
      this.head = this.tail = this.cursor = node;
    } else {
      node.prev = this.tail;
      this.tail.next = node;
      this.tail = node;
    }
    this.count++;
  }
  /** Mueve el cursor a lo más reciente. */
  toLatest(): T | undefined {
    this.cursor = this.tail;
    return this.cursor?.value;
  }
  current(): T | undefined {
    return this.cursor?.value;
  }
  next(): T | undefined {
    if (this.cursor?.next) this.cursor = this.cursor.next;
    return this.cursor?.value;
  }
  prev(): T | undefined {
    if (this.cursor?.prev) this.cursor = this.cursor.prev;
    return this.cursor?.value;
  }
  hasNext(): boolean {
    return !!this.cursor?.next;
  }
  hasPrev(): boolean {
    return !!this.cursor?.prev;
  }
  /** Posición 1-based del cursor. */
  position(): number {
    let i = 0;
    for (let cur = this.head; cur; cur = cur.next) {
      i++;
      if (cur === this.cursor) return i;
    }
    return 0;
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
