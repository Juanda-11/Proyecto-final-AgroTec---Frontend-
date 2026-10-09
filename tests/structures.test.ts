import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AVLTree, CircularLinkedList, DoublyCircularList, DoublyLinkedList, Graph, NaryNode, NaryTree,
  Queue, SinglyLinkedList, Stack, Trie,
} from "../src/structures";

test("Stack: LIFO, capacidad y vacío", () => {
  const s = new Stack<number>(3);
  assert.equal(s.pop(), undefined);
  [1, 2, 3, 4].forEach((n) => s.push(n));
  assert.deepEqual(s.toArray(), [4, 3, 2]);
  assert.equal(s.pop(), 4);
});

test("Queue: FIFO y compactación", () => {
  const q = new Queue<number>();
  for (let i = 0; i < 200; i++) q.enqueue(i);
  for (let i = 0; i < 150; i++) assert.equal(q.dequeue(), i);
  assert.equal(q.size, 50);
  assert.equal(q.peek(), 150);
  assert.equal(new Queue().dequeue(), undefined);
});

test("SinglyLinkedList: prepend/append/remove", () => {
  const l = new SinglyLinkedList<number>();
  l.prepend(2); l.prepend(1); l.append(3);
  assert.deepEqual(l.toArray(), [1, 2, 3]);
  assert.ok(l.remove((x) => x === 1));
  assert.ok(l.remove((x) => x === 3));
  assert.deepEqual(l.toArray(), [2]);
  assert.equal(l.remove((x) => x === 9), false);
  assert.equal(l.size, 1);
});

test("DoublyLinkedList: cursor adelante/atrás sin salirse", () => {
  const l = new DoublyLinkedList<string>();
  assert.equal(l.next(), undefined);
  ["a", "b", "c"].forEach((x) => l.append(x));
  assert.equal(l.toLatest(), "c");
  assert.equal(l.prev(), "b");
  assert.equal(l.prev(), "a");
  assert.equal(l.prev(), "a");
  assert.equal(l.position(), 1);
  assert.equal(l.next(), "b");
});

test("CircularLinkedList: da la vuelta", () => {
  const l = new CircularLinkedList<string>();
  assert.equal(l.next(), undefined);
  ["papa", "café", "hortalizas"].forEach((x) => l.add(x));
  assert.deepEqual(l.toArray(), ["papa", "café", "hortalizas"]);
  assert.deepEqual([l.next(), l.next(), l.next(), l.next()], ["café", "hortalizas", "papa", "café"]);
  const one = new CircularLinkedList<number>(); one.add(1);
  assert.equal(one.next(), 1);
});

test("DoublyCircularList: adelante y atrás circular", () => {
  const l = new DoublyCircularList<number>();
  [1, 2, 3].forEach((x) => l.add(x));
  assert.equal(l.prev(), 3);
  assert.equal(l.next(), 1);
  assert.equal(l.next(), 2);
  assert.deepEqual(l.toArray(), [1, 2, 3]);
});

test("AVL: se mantiene balanceado con inserciones ordenadas", () => {
  const t = new AVLTree<string>();
  for (let i = 1; i <= 1000; i++) t.insert(i, `p${i}`);
  assert.ok(t.isBalanced());
  assert.ok(t.height <= 14, `altura ${t.height}`); // 1.44*log2(1000) ≈ 14
  assert.equal(t.find(500), "p500");
  assert.equal(t.find(5000), undefined);
  assert.ok(t.rotations > 0);
});

test("AVL: rotaciones LR/RL, borrado e inorden", () => {
  const t = new AVLTree<number>();
  [30, 10, 20].forEach((k) => t.insert(k, k)); // LR
  assert.deepEqual(t.levels()[0], [20]);
  const u = new AVLTree<number>();
  [10, 30, 20].forEach((k) => u.insert(k, k)); // RL
  assert.deepEqual(u.levels()[0], [20]);
  [5, 25, 35, 1].forEach((k) => t.insert(k, k));
  assert.ok(t.remove(10) && t.isBalanced());
  assert.equal(t.remove(999), false);
  const keys = t.inorder().map((x) => x.key);
  assert.deepEqual(keys, [...keys].sort((a, b) => a - b));
});

test("NaryTree: recorrido, profundidad y camino", () => {
  const root = new NaryNode("Finca");
  const lote = root.addChild("Lote Norte");
  lote.addChild("Papa").addChild("Sensor humedad");
  lote.addChild("Café");
  const t = new NaryTree(root);
  assert.equal(t.count(), 5);
  assert.equal(t.depth(), 4);
  assert.deepEqual(t.pathTo((v) => v === "Sensor humedad"), ["Finca", "Lote Norte", "Papa", "Sensor humedad"]);
  assert.equal(t.pathTo((v) => v === "x"), null);
});

test("Graph: BFS, DFS, Dijkstra y desconectados", () => {
  const g = new Graph();
  g.addEdge("A", "B", 1); g.addEdge("B", "C", 1); g.addEdge("A", "C", 5); g.addVertex("Z");
  assert.deepEqual(g.shortestPath("A", "C"), { path: ["A", "B", "C"], distance: 2 });
  assert.deepEqual(g.shortestPath("A", "Z").path, []);
  assert.deepEqual(g.shortestPath("A", "A"), { path: ["A"], distance: 0 });
  assert.deepEqual(g.bfs("A"), ["A", "B", "C"]);
  assert.equal(g.dfs("A")[0], "A");
  assert.equal(g.dfs("A").length, 3);
  assert.equal(g.isConnected("A", "Z"), false);
  assert.equal(g.edges().length, 3);
});

test("Trie: prefijos, tildes y límite", () => {
  const t = new Trie();
  ["Tizón tardío", "tizón temprano", "roya", "Ácaros"].forEach((w) => t.insert(w));
  assert.deepEqual(t.startsWith("tizon").sort(), ["Tizón tardío", "tizón temprano"]);
  assert.deepEqual(t.startsWith("aca"), ["Ácaros"]);
  assert.deepEqual(t.startsWith("zzz"), []);
  assert.ok(t.has("ROYA") && !t.has("roy"));
  assert.equal(t.startsWith("t", 1).length, 1);
});
