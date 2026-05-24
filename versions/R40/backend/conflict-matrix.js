/**
 * Matriz de conflictos entre salidas Q1-Q30.
 * Cada par [a, b] significa "Q_a y Q_b NO pueden estar ON simultáneamente".
 * Antes de cada comando, validate() comprueba el conjunto deseado.
 */
export class ConflictMatrix {
  constructor(pairs = []) {
    this.setPairs(pairs);
  }

  setPairs(pairs) {
    this.pairs = (pairs || [])
      .filter((p) => Array.isArray(p) && p.length === 2 && Number.isInteger(p[0]) && Number.isInteger(p[1]))
      .map(([a, b]) => [Math.min(a, b), Math.max(a, b)]);
  }

  getPairs() {
    return this.pairs.map(([a, b]) => [a, b]);
  }

  /**
   * @param {number[]} qSet — array de Qs (1-30) que estarian ON.
   * @returns {{ ok: boolean, conflicts: [number, number][] }}
   */
  validate(qSet) {
    const set = new Set(qSet);
    const conflicts = [];
    for (const [a, b] of this.pairs) {
      if (set.has(a) && set.has(b)) conflicts.push([a, b]);
    }
    return { ok: conflicts.length === 0, conflicts };
  }
}
