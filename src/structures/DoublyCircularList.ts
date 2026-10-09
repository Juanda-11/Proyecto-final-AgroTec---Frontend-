class DCNode<T> {
  next: DCNode<T> = this;
  prev: DCNode<T> = this;
  constructor(public value: T) {}
}

/** Lista circular doblemente enlazada. Uso: ronda de monitoreo con avance y retroceso. */
export class DoublyCircularList<T> {
  private first: DCNode<T> | null = null;
  private cursor: DCNode<T> | null = null;
  private count = 0;

  add(value: T): void {
    const node = new DCNode(value);
    if (!this.first) {
      this.first = this.cursor = node;
    } else {
      const last = this.first.prev;
      node.next = this.first;
      node.prev = last;
      last.next = node;
      this.first.prev = node;
    }
    this.count++;
  }
  current(): T | undefined {
    return this.cursor?.value;
  }
  next(): T | undefined {
    if (!this.cursor) return undefined;
    this.cursor = this.cursor.next;
    return this.cursor.value;
  }
  prev(): T | undefined {
    if (!this.cursor) return undefined;
    this.cursor = this.cursor.prev;
    return this.cursor.value;
  }
  get size(): number {
    return this.count;
  }
  toArray(): T[] {
    if (!this.first) return [];
    const out: T[] = [];
    let cur = this.first;
    do {
      out.push(cur.value);
      cur = cur.next;
    } while (cur !== this.first);
    return out;
  }
}
