class TrieNode {
  children = new Map<string, TrieNode>();
  isWord = false;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Trie (estructura investigada). Búsqueda por prefijo O(k), ignora tildes y mayúsculas. */
export class Trie {
  private root = new TrieNode();
  private originals = new Map<string, string>();

  insert(word: string): void {
    const key = norm(word);
    let node = this.root;
    for (const ch of key) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
      node = node.children.get(ch)!;
    }
    node.isWord = true;
    this.originals.set(key, word);
  }
  has(word: string): boolean {
    let node: TrieNode | undefined = this.root;
    for (const ch of norm(word)) {
      node = node.children.get(ch);
      if (!node) return false;
    }
    return node.isWord;
  }
  startsWith(prefix: string, limit = 6): string[] {
    const p = norm(prefix.trim());
    let node: TrieNode = this.root;
    for (const ch of p) {
      const next = node.children.get(ch);
      if (!next) return [];
      node = next;
    }
    const out: string[] = [];
    const walk = (n: TrieNode, acc: string) => {
      if (out.length >= limit) return;
      if (n.isWord) out.push(this.originals.get(acc) ?? acc);
      for (const [ch, c] of n.children) walk(c, acc + ch);
    };
    walk(node, p);
    return out;
  }
}
