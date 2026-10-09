class CNode<T> {
  constructor(public value: T, public next: CNode<T> = null as unknown as CNode<T>) {}
}

/** Lista circular. Uso: rotación de cultivos / ronda de inspección. */
export class CircularLinkedList<T> {
  private tail: CNode<T> | null = null; // tail.next = primero
  private cursor: CNode<T> | null = null;
  private count = 0;

  add(value: T): void {
    const node = new CNode(value);
    if (!this.tail) {
      node.next = node;
      this.tail = this.cursor = node;
    } else {
      node.next = this.tail.next;
      this.tail.next = node;
      this.tail = node;
    }
    this.count++;
  }
  current(): T | undefined {
    return this.cursor?.value;
  }
  /** Avanza y devuelve el nuevo elemento actual; tras el último vuelve al primero. */
  next(): T | undefined {
    if (!this.cursor) return undefined;
    this.cursor = this.cursor.next;
    return this.cursor.value;
  }
  get size(): number {
    return this.count;
  }
  toArray(): T[] {
    if (!this.tail) return [];
    const out: T[] = [];
    let cur = this.tail.next;
    do {
      out.push(cur.value);
      cur = cur.next;
    } while (cur !== this.tail.next);
    return out;
  }
}
