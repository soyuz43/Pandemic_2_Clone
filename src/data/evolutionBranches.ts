import {
  Bug,
  Droplets,
  Ghost,
  Plane,
  Scale,
  Ship,
  ShieldCheck,
  Sparkles,
  Thermometer,
  type LucideIcon,
} from 'lucide-react';

/**
 * The nine evolution branches are grouped into four topics so the player can
 * reason about a strategy instead of scrolling one long flat list. A topic is
 * a tab on the evolution rail; the branches inside it expand as accordions.
 *
 * Topics are a pure presentation concern — the underlying evolution tree
 * (branches, tiers, `requires` links) is untouched.
 */
export type EvolutionTopicId = 'spreading' | 'severity' | 'survival' | 'edge';

export interface EvolutionTopic {
  id: EvolutionTopicId;
  label: string;
  blurb: string;
  icon: LucideIcon;
  /** Tailwind text colour used for the topic accent. */
  accent: string;
  /** Tailwind border colour used for the topic accent. */
  border: string;
}

export const EVOLUTION_TOPICS: EvolutionTopic[] = [
  {
    id: 'spreading',
    label: 'Spreading',
    blurb: 'How your pathogen travels.',
    icon: Plane,
    accent: 'text-sky-400',
    border: 'border-sky-400/40',
  },
  {
    id: 'severity',
    label: 'Severity',
    blurb: 'Symptoms and the damage they cause.',
    icon: Bug,
    accent: 'text-red',
    border: 'border-red/40',
  },
  {
    id: 'survival',
    label: 'Survival',
    blurb: 'Outlast climate, cure and scrutiny.',
    icon: ShieldCheck,
    accent: 'text-emerald-400',
    border: 'border-emerald-400/40',
  },
  {
    id: 'edge',
    label: 'Edge',
    blurb: 'Opinionated trade-off builds.',
    icon: Sparkles,
    accent: 'text-fuchsia-400',
    border: 'border-fuchsia-400/40',
  },
];

export interface EvolutionBranch {
  id: string;
  label: string;
  topic: EvolutionTopicId;
  icon: LucideIcon;
  /** Tailwind text colour for the branch heading. */
  accent: string;
  /** One-line explanation of what this branch is for. */
  blurb: string;
}

/**
 * Every branch must appear exactly once here, and every branch id used by the
 * evolution data must exist in this list. `evolutionBranches.test.ts` enforces
 * both directions, so the UI can never drift out of sync with the data.
 */
export const EVOLUTION_BRANCHES: EvolutionBranch[] = [
  // ---- Spreading ----
  {
    id: 'air',
    label: 'Air Travel',
    topic: 'spreading',
    icon: Plane,
    accent: 'text-sky-400',
    blurb: 'Rides cabin air between continents.',
  },
  {
    id: 'sea',
    label: 'Sea Travel',
    topic: 'spreading',
    icon: Ship,
    accent: 'text-cyan-400',
    blurb: 'Ships cargo and ballast water across oceans.',
  },
  {
    id: 'water',
    label: 'Waterborne',
    topic: 'spreading',
    icon: Droplets,
    accent: 'text-blue',
    blurb: 'Contaminates the local water supply of each country.',
  },
  {
    id: 'vector',
    label: 'Vectors',
    topic: 'spreading',
    icon: Bug,
    accent: 'text-emerald-400',
    blurb: 'Moves through insects, animals and livestock.',
  },

  // ---- Severity ----
  {
    id: 'symptom',
    label: 'Symptoms',
    topic: 'severity',
    icon: Scale,
    accent: 'text-red',
    blurb: 'Visible illness: more spread, more damage, more attention.',
  },

  // ---- Survival ----
  {
    id: 'resistance',
    label: 'Drug Resistance',
    topic: 'survival',
    icon: ShieldCheck,
    accent: 'text-fuchsia-400',
    blurb: 'Slows and weakens the cure researchers are building.',
  },
  {
    id: 'climate',
    label: 'Climate',
    topic: 'survival',
    icon: Thermometer,
    accent: 'text-amber-400',
    blurb: 'Withstands hot, cold and temperate regions.',
  },
  {
    id: 'stealth',
    label: 'Stealth',
    topic: 'survival',
    icon: Ghost,
    accent: 'text-purple-400',
    blurb: 'Hides from detection so the cure never starts.',
  },

  // ---- Edge ----
  {
    id: 'specialist',
    label: 'Specializations',
    topic: 'edge',
    icon: Sparkles,
    accent: 'text-orange-400',
    blurb: 'Powerful, opinionated builds with a built-in downside.',
  },
];

/** Lookup for a branch id, or undefined when the data has an unknown branch. */
export function getBranch(branchId: string): EvolutionBranch | undefined {
  return EVOLUTION_BRANCHES.find(b => b.id === branchId);
}

/** Lookup for a topic id. */
export function getTopic(topicId: EvolutionTopicId): EvolutionTopic | undefined {
  return EVOLUTION_TOPICS.find(t => t.id === topicId);
}

/** Branch ids belonging to a topic, in display order. */
export function branchesForTopic(topicId: EvolutionTopicId): EvolutionBranch[] {
  return EVOLUTION_BRANCHES.filter(b => b.topic === topicId);
}
