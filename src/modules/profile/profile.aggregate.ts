interface RawSkill {
  name?: string;
  category?: string;
  evidence?: string;
  confidence?: number;
}
interface RawRole {
  title?: string;
  organization?: string;
  summary?: string;
}
interface RawExtracted {
  summary?: string;
  skills?: RawSkill[];
  roles?: RawRole[];
}

export interface AggregatedSkill {
  name: string;
  category: string;
  evidence: string[];
  sources: string[];
  confidence: number;
}
export interface Aggregated {
  skills: AggregatedSkill[];
  roles: RawRole[];
  sourceTypes: string[];
}

export interface SourceLike {
  type: string;
  extracted?: unknown;
}

/**
 * Deterministic pre-merge across sources (no AI). Groups skills by normalized name,
 * unions their evidence + source origins, and keeps the max confidence. This shrinks
 * and cleans the payload before the AI canonicalization pass — and it's the part of
 * consolidation we can unit-test precisely.
 */
export function aggregateExtracted(sources: SourceLike[]): Aggregated {
  const skillMap = new Map<string, AggregatedSkill>();
  const roles: RawRole[] = [];
  const sourceTypes: string[] = [];

  for (const source of sources) {
    const extracted = (source.extracted ?? {}) as RawExtracted;
    sourceTypes.push(source.type);

    for (const sk of extracted.skills ?? []) {
      if (!sk.name) continue;
      const key = sk.name.trim().toLowerCase();
      const existing = skillMap.get(key);
      if (existing) {
        if (sk.evidence) existing.evidence.push(sk.evidence);
        if (!existing.sources.includes(source.type)) existing.sources.push(source.type);
        existing.confidence = Math.max(existing.confidence, sk.confidence ?? 0);
      } else {
        skillMap.set(key, {
          name: sk.name.trim(),
          category: sk.category ?? "other",
          evidence: sk.evidence ? [sk.evidence] : [],
          sources: [source.type],
          confidence: sk.confidence ?? 0,
        });
      }
    }

    for (const role of extracted.roles ?? []) {
      if (role.title) roles.push(role);
    }
  }

  return { skills: [...skillMap.values()], roles, sourceTypes };
}
