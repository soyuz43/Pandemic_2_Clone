import { describe, it, expect } from 'vitest';
import { evolutions } from '../../data/evolutions';

describe('evolution tree integrity', () => {
  it('has 48 evolutions with unique ids', () => {
    expect(evolutions).toHaveLength(48);
    const ids = evolutions.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has no dangling requires references', () => {
    const ids = new Set(evolutions.map(e => e.id));
    for (const evo of evolutions) {
      for (const req of evo.requires ?? []) {
        expect(ids.has(req), `${evo.id} requires unknown ${req}`).toBe(true);
      }
    }
  });

  it('makes every node reachable from a root', () => {
    const byId = new Map(evolutions.map(e => [e.id, e]));
    const reachable = new Set<string>();
    let changed = true;
    while (changed) {
      changed = false;
      for (const evo of evolutions) {
        if (reachable.has(evo.id)) continue;
        const prereqs = evo.requires ?? [];
        if (prereqs.every(r => reachable.has(r))) {
          reachable.add(evo.id);
          changed = true;
        }
      }
    }
    const unreachable = evolutions.filter(e => !reachable.has(e.id)).map(e => e.id);
    expect(unreachable).toEqual([]);
    expect(byId.size).toBe(48);
  });

  it('has no self-referential requirements', () => {
    for (const evo of evolutions) {
      expect(evo.requires ?? []).not.toContain(evo.id);
    }
  });

  it('covers all nine branches with at least one node each', () => {
    const branches = new Set(evolutions.map(e => e.branch));
    expect([...branches].sort()).toEqual([
      'air', 'climate', 'resistance', 'sea', 'specialist',
      'stealth', 'symptom', 'vector', 'water',
    ]);
    for (const branch of branches) {
      expect(evolutions.filter(e => e.branch === branch).length).toBeGreaterThan(0);
    }
  });

  it('orders each branch by non-decreasing tier so the tree indents consistently', () => {
    const byBranch = new Map<string, number[]>();
    for (const evo of evolutions) {
      if (!byBranch.has(evo.branch)) byBranch.set(evo.branch, []);
      byBranch.get(evo.branch)!.push(evo.tier);
    }
    for (const [branch, tiers] of byBranch) {
      for (let i = 1; i < tiers.length; i++) {
        expect(tiers[i], `branch ${branch} tier order`).toBeGreaterThanOrEqual(tiers[i - 1]);
      }
    }
  });

  it('gives every trade-off evolution a human-readable drawback', () => {
    for (const evo of evolutions) {
      if (evo.tradeoff) {
        expect(evo.drawback, `${evo.id} missing drawback`).toBeTruthy();
      }
    }
  });

  it('gives every evolution a positive cost and a description', () => {
    for (const evo of evolutions) {
      expect(evo.cost, evo.id).toBeGreaterThan(0);
      expect(evo.description.length, evo.id).toBeGreaterThan(0);
      expect(evo.name.length, evo.id).toBeGreaterThan(0);
    }
  });
});
