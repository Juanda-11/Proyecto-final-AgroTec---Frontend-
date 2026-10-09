/** Pila LIFO. Uso en AgroTec: historial de acciones con "deshacer". */
export class Stack<T> {
  private items: T[] = [];

  constructor(private readonly capacity = Infinity) {}

  push(item: T): void {
    this.items.push(item);
    if (this.items.length > this.capacity) this.items.shift();
  }
  pop(): T | undefined {
    return this.items.pop();
  }
  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }
  isEmpty(): boolean {
    return this.items.length === 0;
  }
  get size(): number {
    return this.items.length;
  }
  /** De más reciente a más antiguo. */
  toArray(): T[] {
    return [...this.items].reverse();
  }
}
