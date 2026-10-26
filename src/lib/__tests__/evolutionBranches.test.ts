import { describe, it, expect } from 'vitest';
import { evolutions } from '../../data/evolutions';
import {
  EVOLUTION_BRANCHES,
  EVOLUTION_TOPICS,
  branchesForTopic,
  getBranch,
  getTopic,
} from '../../data/evolutionBranches';

describe('evolution branch metadata', () => {
  it('covers every branch used by the evolution data', () => {
    const known = new Set(EVOLUTION_BRANCHES.map(b => b.id));
    const used = new Set(evolutions.map(e => e.branch));
    const missing = [...used].filter(b => !known.has(b));
    expect(missing, `branches missing from EVOLUTION_BRANCHES: ${missing.join(', ')}`).toEqual([]);
  });

  it('does not define branches that the evolution data never uses', () => {
    const used = new Set(evolutions.map(e => e.branch));
    const orphans = EVOLUTION_BRANCHES.filter(b => !used.has(b.id)).map(b => b.id);
    expect(orphans, `branches with no evolutions: ${orphans.join(', ')}`).toEqual([]);
  });

  it('defines each branch exactly once', () => {
    const ids = EVOLUTION_BRANCHES.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('assigns every branch to a known topic', () => {
    const topicIds = new Set(EVOLUTION_TOPICS.map(t => t.id));
    for (const branch of EVOLUTION_BRANCHES) {
      expect(topicIds.has(branch.topic), `${branch.id} -> ${branch.topic}`).toBe(true);
    }
  });

  it('gives every topic at least one branch', () => {
    for (const topic of EVOLUTION_TOPICS) {
      expect(branchesForTopic(topic.id).length, topic.id).toBeGreaterThan(0);
    }
  });

  it('places every branch in exactly one topic', () => {
    const assigned = EVOLUTION_TOPICS.flatMap(t => branchesForTopic(t.id).map(b => b.id));
    expect(assigned.sort()).toEqual(EVOLUTION_BRANCHES.map(b => b.id).sort());
  });

  it('gives every topic and branch a label and a blurb', () => {
    for (const topic of EVOLUTION_TOPICS) {
      expect(topic.label.length, topic.id).toBeGreaterThan(0);
      expect(topic.blurb.length, topic.id).toBeGreaterThan(0);
      expect(topic.icon, topic.id).toBeTruthy();
    }
    for (const branch of EVOLUTION_BRANCHES) {
      expect(branch.label.length, branch.id).toBeGreaterThan(0);
      expect(branch.blurb.length, branch.id).toBeGreaterThan(0);
      expect(branch.icon, branch.id).toBeTruthy();
    }
  });

  it('resolves branches and topics by id', () => {
    expect(getBranch('air')?.label).toBe('Air Travel');
    expect(getBranch('does-not-exist')).toBeUndefined();
    expect(getTopic('spreading')?.label).toBe('Spreading');
    expect(getTopic('does-not-exist' as never)).toBeUndefined();
  });
});
