/** Cola FIFO con índice de cabeza (dequeue O(1) amortizado). Uso: cola de alertas por atender. */
export class Queue<T> {
  private items: T[] = [];
  private head = 0;

  enqueue(item: T): void {
    this.items.push(item);
  }
  dequeue(): T | undefined {
    if (this.head >= this.items.length) return undefined;
    const item = this.items[this.head++];
    if (this.head > 32 && this.head * 2 > this.items.length) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
    return item;
  }
  peek(): T | undefined {
    return this.items[this.head];
  }
  isEmpty(): boolean {
    return this.size === 0;
  }
  get size(): number {
    return this.items.length - this.head;
  }
  toArray(): T[] {
    return this.items.slice(this.head);
  }
}
